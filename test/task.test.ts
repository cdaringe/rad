import {
  Task,
  execute,
  getParialFromUserTask,
  Makearooni,
  asFuncarooni,
} from "../src/Task.ts";
import fixtures from "./fixtures/mod.ts";
import { testing } from "../src/3p/std.test.ts";
import { fs, path } from "../src/3p/std.ts";
import * as rad from "../src/mod.ts";
import { fromTasks } from "../src/TaskGraph.ts";
import { assert } from "https://deno.land/std@v0.42.0/testing/asserts.ts";
const { writeFileStr } = fs;

const { assertEquals } = testing;

const logster = { logger: await fixtures.getTestLogger() };

Deno.test({
  name: "user task",
  fn: async () => {
    const userTask: Task = {
      fn: () => 1,
    };
    const result = await execute(
      getParialFromUserTask({ key: "user_task", value: userTask }, logster),
      logster,
    );
    assertEquals(result, 1, "task fn returns result");
  },
});

Deno.test({
  name: "make - only runs task on file change",
  fn: async () => {
    const testDir = await Deno.makeTempDir({ prefix: "test_rad" });
    const targetFilename = await Deno.makeTempFile(
      { dir: testDir, suffix: ".ts" },
    );
    const inputFilename = await Deno.makeTempFile(
      { dir: testDir, suffix: ".ts" },
    );
    let onMakeCallCount = 0;
    const makearooni: Makearooni = {
      target: targetFilename,
      prereqs: [inputFilename],
      cwd: testDir,
      onMake: async (
        _toolkit,
        { getPrereqFilenames, getChangedPrereqFilenames },
      ) => {
        const all = await getPrereqFilenames();
        assertEquals(all.length, 1);
        const changed = await getChangedPrereqFilenames();
        if (onMakeCallCount > 0) {
          // second pass
          assertEquals(changed.length, 0, "no file on second pass");
        } else {
          // first pass
          assertEquals(changed[0], inputFilename, "prereq shows up");
          assertEquals(changed.length, 1);
        }
        ++onMakeCallCount;
      },
    };
    const funcarooni = asFuncarooni(makearooni, logster);
    const getTask = () =>
      getParialFromUserTask(
        { key: "user_make_task", value: { ...funcarooni } },
        logster,
      );
    await execute(getTask(), logster);
    assertEquals(onMakeCallCount, 1);
    // modified time has ~1s resolution. wait at least 1s
    await new Promise((res) => setTimeout(res, 1000));
    await writeFileStr(targetFilename, "test_change");
    await execute(getTask(), logster);
    assertEquals(onMakeCallCount, 2);
  },
});

Deno.test({
  name:
    "make - multiple output - paired input/output files - only runs task on file change",
  fn: async () => {
    /**
     * this test exercises fixtures/make.multi.target functionality.
     * two inputs (I1, I2) are built => two outputs (O1, O2)
     * I1 changes => only I1 marked as changed, O1 updated
     * O2 asserted unchanged
     * I2 changes => only I2 marked as changed, O2 updated
     * O1 asserted unchanged
     */
    var { dirname } = await fixtures.createTestFolderContext();
    const [
      i1,
      i2,
      o1,
      o2,
    ] = [
      path.resolve(dirname, "src/a.inext"),
      path.resolve(dirname, "src/b.inext"),
      path.resolve(dirname, "out/a.outext"),
      path.resolve(dirname, "out/b.outext"),
    ];
    await fixtures.copyContents(fixtures.makeMultiTarget, dirname);
    var radness = await rad.init(
      {
        radFilename: path.join(dirname, "rad.ts"),
        ...fixtures.withTestLogger,
      },
    );
    let nextOnMake: Makearooni["onMake"] = async (tk, m) => {};
    let callCount = 0;
    assert(radness.tasks.build, "dangerously mutating fixture task in memory");
    radness.tasks.build = {
      ...radness.tasks.build as any,
      cwd: dirname,
      onMake: (t, m) => ++callCount && nextOnMake(t, m),
    };
    const getBuildTask = () =>
      fromTasks(radness.tasks, fixtures.withTestLogger).graph.build;

    //
    const [stat1, _stat2] = await Promise.all([Deno.stat(i1), Deno.stat(i2)]);
    assertEquals(stat1.isFile, true);
    assertEquals(callCount, 0);

    //
    nextOnMake = async ({ fs, sleep, task }, { getChangedPrereqFilenames }) => {
      const changed = await getChangedPrereqFilenames();
      assertEquals(changed.length, 2, "initial build has two inputs");
      // mock "build" outputs o1, o2, edit i1
      await Promise.all([
        fs.writeFile(o1, "o1"),
        fs.writeFile(o2, "o2"),
      ]);
      await sleep(1000);
      await fs.writeFile(i1, "i1-edit-1");
    };
    await execute(getBuildTask(), fixtures.withTestLogger);
    assertEquals(callCount, 1);

    //
    nextOnMake = async ({ fs }, { getChangedPrereqFilenames }) => {
      const changed = await getChangedPrereqFilenames();
      assertEquals(changed.length, 1, "onChange has one changed");
      assertEquals(changed[0], i1, "input 1 (i1) is only changed file");
      await fs.writeFile(o1, "o1-edit-1");
      await Deno.remove(o2);
    };
    await execute(getBuildTask(), fixtures.withTestLogger);
    assertEquals(callCount, 2);

    //
    nextOnMake = async ({}, { getChangedPrereqFilenames }) => {
      const changed = await getChangedPrereqFilenames();
      assertEquals(changed.length, 1, "onChange has one changed");
      assertEquals(
        changed[0],
        i2,
        "input 1 (i2) shows changed due to o2 missing",
      );
    };
    await execute(getBuildTask(), fixtures.withTestLogger);
    assertEquals(callCount, 3);
  },
});

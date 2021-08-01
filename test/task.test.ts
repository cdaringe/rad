import {
  asFuncarooni,
  execute,
  getPartialFromUserTask,
  Makearooni,
  RadTask,
  Task,
} from "../src/Task.ts";
import fixtures from "./fixtures/mod.ts";
import { path } from "../src/3p/std.ts";
import * as rad from "../src/mod.ts";
import { fromTasks } from "../src/TaskGraph.ts";
import { assert, assertEquals, assertMatch } from "../src/3p/std.test.ts";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const logster = { logger: await fixtures.getTestLogger() };

Deno.test({
  name: fixtures.asTestName("user task", import.meta),
  fn: async () => {
    const userTask: Task = {
      fn: () => 1,
    };
    const result = await execute(
      getPartialFromUserTask({ key: "user_task", value: userTask }, logster),
      logster,
    );
    assertEquals(result, 1, "task fn returns result");
  },
});

Deno.test({
  name: fixtures.asTestName("depends on task with parent error", import.meta),
  fn: async () => {
    const failingTask: Task = {
      fn: () => {
        throw new Error("test_error_message");
      },
    };
    const failingRadTask = getPartialFromUserTask({
      key: "rootTask",
      value: failingTask,
    }, logster);
    const rootTask: Task = {
      dependsOn: [failingTask],
      fn: () => 1,
    };
    const rootRadTask = getPartialFromUserTask({
      key: "rootTask",
      value: rootTask,
    }, logster);
    try {
      await execute(
        {
          ...rootRadTask,
          dependsOn: [failingRadTask],
        },
        logster,
      );
      assertEquals(
        true,
        false,
        "task should have failed--dependsOn task throws",
      );
    } catch (err) {
      assertMatch(
        (err as Error).message,
        /test_error_message/,
        `execute emits error message`,
      );
    }
  },
});

Deno.test({
  name: fixtures.asTestName("serial dependsOn", import.meta),
  fn: async () => {
    const emittedTaskOutput: number[] = [];
    // the following numbers are sleep durations. when processing serially,
    // the fast tasks should be blocked by the slow task. we will capture the
    // completion order of the tasks, and assert that ordering is stable
    const [a, b, c, d] = [0, 10, 5, 1].map((ms) =>
      [String(ms), {
        fn: () =>
          sleep(ms).then(() => {
            emittedTaskOutput.push(ms);
            return ms;
          }),
      } as Task] as const
    )
      .map(([key, value]) => getPartialFromUserTask({ key, value }, logster));
    const root: RadTask = {
      ...a,
      dependsOn: [b, c, d],
      dependsOnSerial: true,
    };
    await execute(root, logster);
    assertEquals(
      emittedTaskOutput,
      [10, 5, 1, 0],
      "dependsOn tasks should execute serially",
    );
  },
});

Deno.test({
  name: fixtures.asTestName(
    "make - only runs task on file change",
    import.meta,
  ),
  fn: async function testMakeOnlyRunTaskOnFileChange() {
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
        {
          changedPrereqs: _,
          prereqs,
          getPrereqFilenames,
          getChangedPrereqFilenames,
        },
      ) => {
        const all = await getPrereqFilenames();
        // walk API has changed time-to-time, so frivolously assert on
        // kv pairs so we detect when we transitively release a breaking change
        for await (const preReq of prereqs) {
          assert(preReq.name, "prereq has name");
          assert(preReq.path, "prereq has path");
          assert("isFile" in preReq, "preReq has isFile prop");
        }
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
      getPartialFromUserTask(
        { key: "user_make_task", value: { ...funcarooni } },
        logster,
      );
    await execute(getTask(), logster);
    assertEquals(onMakeCallCount, 1);
    // modified time has ~1s resolution. wait at least 1s
    await new Promise((res) => setTimeout(res, 1000));
    await Deno.writeTextFile(targetFilename, "test_change");
    await execute(getTask(), logster);
    assertEquals(onMakeCallCount, 2);
  },
});

Deno.test({
  name: fixtures.asTestName(
    "make - multiple output - paired input/output files - only runs task on file change",
    import.meta,
  ),
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
    let nextOnMake: Makearooni["onMake"] = async (_tk, _m) => {};
    let callCount = 0;
    assert(radness.tasks.build, "dangerously mutating fixture task in memory");
    radness.tasks.build = {
      ...radness.tasks.build as Makearooni,
      cwd: dirname,
      onMake: (t, m) => ++callCount && nextOnMake(t, m),
    } as Makearooni;
    const getBuildTask = () =>
      fromTasks(radness.tasks, fixtures.withTestLogger).graph.build;

    //
    const [stat1, _stat2] = await Promise.all([Deno.stat(i1), Deno.stat(i2)]);
    assertEquals(stat1.isFile, true);
    assertEquals(callCount, 0);

    //
    nextOnMake = async ({ sleep }, { getChangedPrereqFilenames }) => {
      const changed = await getChangedPrereqFilenames();
      assertEquals(changed.length, 2, "initial build has two inputs");
      // mock "build" outputs o1, o2, edit i1
      await Promise.all([
        Deno.writeTextFile(o1, "o1"),
        Deno.writeTextFile(o2, "o2"),
      ]);
      await sleep(1100);
      await Deno.writeTextFile(i1, "i1-edit-1");
      await sleep(1100);
    };
    await execute(getBuildTask(), fixtures.withTestLogger);
    assertEquals(callCount, 1);

    //
    nextOnMake = async ({ sleep }, { getChangedPrereqFilenames }) => {
      const changed = await getChangedPrereqFilenames();
      assertEquals(changed.length, 1, "onChange has one changed");
      assertEquals(changed[0], i1, "input 1 (i1) is only changed file");
      await Deno.writeTextFile(o1, "o1-edit-1");
      await Deno.remove(o2);
      await sleep(1100);
    };
    await execute(getBuildTask(), fixtures.withTestLogger);
    assertEquals(callCount, 2);

    //
    nextOnMake = async (_, { getChangedPrereqFilenames }) => {
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

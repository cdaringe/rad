import {
  Task,
  execute,
  getParialFromUserTask,
  Makearooni,
  asFuncarooni,
} from "../src/Task.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import fixtures from "./fixtures/mod.ts";
import { writeFileStr } from "https://deno.land/std/fs/write_file_str.ts";
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
      onMake: async (toolkit, { getPrereqFilenames, getChangedPrereqFilenames }) => {
        const all = await getPrereqFilenames()
        assertEquals(all.length, 1)
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

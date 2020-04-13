import { Task, execute, getParialFromUserTask } from "../src/Task.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test({
  name: "user task",
  fn: async () => {
    const userTask: Task = {
      fn: () => 1,
    };
    const result = await execute(
      getParialFromUserTask({ key: "user_task", value: userTask }),
    );
    assertEquals(result, 1, "task fn returns result");
  },
});

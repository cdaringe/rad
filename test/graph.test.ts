import { assertEquals, assert } from "https://deno.land/std/testing/asserts.ts";
import { Radness } from "../src/Radness.ts";
import { run, fromTasks } from "../src/TaskGraph.ts";
import { UserTask } from "../src/Task.ts";
import { logger } from "../src/logger.ts";

const basicRadness: Radness = {
  tasks: {
    radness_format_test: {
      fn: () => 1,
    },
  },
};

const sumDependentResultsWith = (input: any) =>
  ({ dependentResults }: { dependentResults: any[] }) =>
    dependentResults.reduce((acc, v) => acc + v, input);

const d: UserTask = {
  fn: sumDependentResultsWith("d"),
};
const c: UserTask = {
  fn: sumDependentResultsWith("c"),
};
const b: UserTask = {
  dependsOn: [c, d],
  fn: sumDependentResultsWith("b"),
};
const a: UserTask = {
  dependsOn: [b],
  fn: sumDependentResultsWith("a"),
};

const basicRadnessWithDependencies: Radness = {
  tasks: {
    a,
    b,
    c,
    d,
  },
};

Deno.test({
  name: "user tasks in Radness format",
  fn: async () => {
    const result = await run({
      name: "radness_format_test",
      graph: fromTasks(basicRadness.tasks),
    });
    assertEquals(result, 1, "task fn returns result");
  },
});

Deno.test({
  name: "tasks traverse `dependsOn` graphs",
  fn: async () => {
    const result = await run({
      name: "a",
      graph: fromTasks(basicRadnessWithDependencies.tasks),
    });
    assertEquals(result, "abcd", "tasks execute in order");
  },
});

Deno.test({
  name: "tasks builds reports on traversal",
  fn: async () => {
    const graph = fromTasks(basicRadnessWithDependencies.tasks);
    const result = await run({
      name: "a",
      graph,
    });
    assert(result, "has result");
    Object.values(graph.graph).map((task) => {
      assert(task.name, "task present w/ name");
      assert(task.report?.message, "task has message on completion");
      const timingValues = Object.values(task.report?.timing);
      assert(timingValues.length, "has timing values");
      assert(
        timingValues.map((timingValue) => typeof timingValue === "number"),
        "timings all values",
      );
    });
  },
});

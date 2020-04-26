import { assertEquals, assert } from "https://deno.land/std/testing/asserts.ts";
import { Radness } from "../src/Radness.ts";
import { run, fromTasks, asTree } from "../src/TaskGraph.ts";
import { Task } from "../src/Task.ts";
import fixtures from "./fixtures/mod.ts";
import { writeFileStr } from "https://deno.land/std/fs/write_file_str.ts";

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

const d: Task = {
  fn: sumDependentResultsWith("d"),
};
const c: Task = {
  fn: sumDependentResultsWith("c"),
};
const b: Task = {
  dependsOn: [c, d],
  fn: sumDependentResultsWith("b"),
};
const a: Task = {
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
      graph: fromTasks(basicRadness.tasks, fixtures.withTestLogger),
      ...fixtures.withTestLogger,
    });
    assertEquals(result, 1, "task fn returns result");
  },
});

Deno.test({
  name: "tasks traverse `dependsOn` graphs",
  fn: async () => {
    const result = await run({
      name: "a",
      graph: fromTasks(
        basicRadnessWithDependencies.tasks,
        fixtures.withTestLogger,
      ),
      ...fixtures.withTestLogger,
    });
    assertEquals(result, "abcd", "tasks execute in order");
  },
});

Deno.test({
  name: "tasks builds reports on traversal",
  fn: async () => {
    const graph = fromTasks(
      basicRadnessWithDependencies.tasks,
      fixtures.withTestLogger,
    );
    const result = await run({
      name: "a",
      graph,
      ...fixtures.withTestLogger,
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

const expectedPrintGraphTree = `
├─ a
│  └─ b
│     ├─ c
│     └─ d
├─ b
│  ├─ c
│  └─ d
├─ c
└─ d
`

Deno.test({
  name: 'print-graph',
  async fn() {
    const graph = fromTasks(basicRadnessWithDependencies.tasks, fixtures.withTestLogger)
    const tree = asTree({ graph, ...fixtures.withTestLogger })
    assertEquals(tree.trim(), expectedPrintGraphTree.trim(), "tree prints ok");
  }
})

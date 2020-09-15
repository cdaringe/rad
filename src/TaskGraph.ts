import {
  RadTask,
  execute,
  getPartialFromUserTask,
  Task,
  asFuncarooni,
} from "./Task.ts";
import * as errors from "./errors.ts";
import type { Radness } from "./Radness.ts";
import type { WithLogger } from "./logger.ts";
import { asTree as treeifyAsTree } from "./3p/treeify.js";

export type TaskGraph = ReturnType<typeof fromTasks>;

type TreeifyNode = { [key: string]: TreeifyNode } | null;

export const addTreeNode = (task: RadTask) => {
  if (!task.dependsOn) return null;
  const subTree: TreeifyNode = {};
  for (const dep of task.dependsOn) subTree[dep.name] = addTreeNode(dep);
  return subTree;
};
export const graphToTreeifyGraph = ({ graph: { graph }, taskName, logger }: {
  graph: TaskGraph;
  taskName?: string;
} & WithLogger) => {
  const taskNames = taskName ? [taskName] : Object.keys(graph);
  const tree: Required<TreeifyNode> = {};
  for (const name of taskNames) {
    const task = graph[name];
    if (!task) throw new errors.RadError(`unable to find task ${name}`);
    tree[name] = addTreeNode(task);
  }
  return tree;
};

export const asTree = ({ graph, logger, taskName }:
  & {
    graph: TaskGraph;
    taskName?: string;
  }
  & WithLogger) =>
  treeifyAsTree(graphToTreeifyGraph({ graph, logger, taskName }));

export function fromTasks(userTasks: Radness["tasks"], { logger }: WithLogger) {
  const userTaskNames = Object.keys(userTasks);
  const userTaskNamesByTask = userTaskNames.reduce((acc, name) => {
    acc.set(userTasks[name], name);
    return acc;
  }, new Map<Task, string>());
  const tasks = userTaskNames.map((key) =>
    getPartialFromUserTask({ key, value: userTasks[key] }, { logger })
  );
  const graph: Record<string, RadTask> = tasks.reduce(
    (acc, v) => ({ ...acc, [v.name]: v }),
    {},
  );
  // dangerously mutate new task memory to swap user input tasks with owned tasks
  userTaskNames.forEach((taskName, i) => {
    const task = graph[taskName];
    const dependents: Task[] =
      asFuncarooni(userTasks[taskName], { logger })?.dependsOn ||
      [];
    task.dependsOn = dependents.map(
      (userDependentTask) => {
        const taskName = userTaskNamesByTask.get(userDependentTask);
        if (!taskName) {
          throw new errors.RadInvalidTaskError(
            `failed to find task name. check \`dependsOn\` of task "${task.name}"`,
          );
        }
        const internalTask = graph[taskName];
        if (!internalTask) {
          throw new Error(`failed to find task ${taskName} in graph`);
        }
        return internalTask;
      },
    );
  });
  return {
    graph,
    tasks,
  };
}

export async function run(
  { name, graph, logger }: { name: string; graph: TaskGraph } & WithLogger,
) {
  var task = graph.graph[name];
  if (!name) {
    throw new errors.RadError(
      `task name required, given ${String(name)}`,
    );
  }
  if (!task) throw new errors.RadError(`task "${name}" not found`);
  var res = await execute(task, { logger });
  return res;
}

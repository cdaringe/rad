import {
  asFuncarooni,
  execute,
  getPartialFromUserTask,
  RadTask,
  Task,
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
  for (const dep of task.dependsOn) {
    subTree[dep.name] = addTreeNode(dep);
  }
  return subTree;
};

export const graphToTreeifyGraph = ({ graph: { graph }, taskName, logger: _ }: {
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
  & WithLogger) => {
  const nextGraph = dealiasGraph(graph.graph);
  return treeifyAsTree(
    graphToTreeifyGraph({ graph: nextGraph, logger, taskName }),
  );
};

export function fromTasks(userTasks: Radness["tasks"], { logger }: WithLogger) {
  const userTaskAliases = Object.keys(userTasks);
  const userTaskAliasesByTask = userTaskAliases.reduce((acc, alias) => {
    acc.set(userTasks[alias], alias);
    return acc;
  }, new Map<Task, string>());
  const tasks = userTaskAliases.map((key) =>
    getPartialFromUserTask({ key, value: userTasks[key] }, { logger })
  );
  const graph: Record<string, RadTask> = tasks.reduce(
    (acc, v) => ({ ...acc, [v.alias]: v }),
    {},
  );
  // dangerously mutate new task memory to swap user input tasks with owned tasks
  userTaskAliases.forEach((alias, _i) => {
    const task = graph[alias];
    const dependents: Task[] =
      asFuncarooni(userTasks[alias], { logger })?.dependsOn ||
      [];
    task.dependsOn = dependents.map(
      (userDependentTask) => {
        const taskName = userTaskAliasesByTask.get(userDependentTask);
        if (!taskName) {
          throw new errors.RadInvalidTaskError([
            `Task not found. All tasks, including dependents, must be`,
            `explicitly added to your rad.ts tasks export.`,
            `check \`dependsOn\` of task "${task.name}"`,
          ].join(" "));
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
  const task = graph.graph[name];
  if (!name) {
    throw new errors.RadError(
      `task name required, given ${String(name)}`,
    );
  }
  if (!task) throw new errors.RadError(`task "${name}" not found`);
  const res = await execute(task, { logger });
  return res;
}

type DealiasedGraph = Record<string, { task: RadTask; aliases: Set<string> }>;

function dealiasGraph(graph: TaskGraph["graph"]): TaskGraph {
  const dealiased = Object.values(graph).reduce<
    DealiasedGraph
  >((acc, currentTask) => {
    const { alias, name } = currentTask;
    const { task, aliases } = acc[currentTask.name] ||
      { task: currentTask, aliases: new Set() };
    // case: no aliases
    if (alias !== name) {
      // case: alias found. remove it from the graph, but add a ref to the alias set
      aliases.add(alias);
      delete acc[alias];
    }
    return {
      ...acc,
      [name]: { task, aliases },
    };
  }, {});

  function formatTaskDescriptor(
    { name, aliases }: {
      name: string;
      aliases: Set<string>;
    },
  ) {
    const aliasText = aliases.size ? ` (${[...aliases].join(", ")})` : "";
    return [name, aliasText].join("");
  }

  const formatTaskTreeWithAliasNames = (task: RadTask): RadTask => {
    if ((task as { _formatted?: boolean })._formatted === true) {
      return task;
    }
    Object.defineProperty(task, "_formatted", {
      value: true,
      enumerable: false,
    });

    task.name = formatTaskDescriptor({
      name: task.name,
      aliases: dealiased[task.name]!.aliases,
    });
    task.dependsOn = task.dependsOn?.map((dep) =>
      formatTaskTreeWithAliasNames(dep)
    );
    return task;
  };

  const nextGraph = Object.values(dealiased).reduce<TaskGraph["graph"]>(
    (acc, { task }) => {
      const nextTask = formatTaskTreeWithAliasNames(task);
      return {
        ...acc,
        [nextTask.name]: nextTask,
      };
    },
    {},
  );
  const nextTasks = Object.values(nextGraph);
  return {
    graph: nextGraph,
    tasks: nextTasks,
  };
}

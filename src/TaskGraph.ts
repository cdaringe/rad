import {
  RadTask,
  execute,
  getParialFromUserTask,
  Task,
  asFuncarooni,
} from "./Task.ts";
import * as errors from "./errors.ts";
import { Radness } from "./Radness.ts";
import { WithLogger } from "./logger.ts";
export type TaskGraph = ReturnType<typeof fromTasks>;

export function fromTasks(userTasks: Radness["tasks"], { logger }: WithLogger) {
  const userTaskNames = Object.keys(userTasks);
  const userTaskNamesByTask = userTaskNames.reduce((acc, name) => {
    acc.set(userTasks[name], name);
    return acc;
  }, new Map<Task, string>());
  const tasks = userTaskNames.map((key) =>
    getParialFromUserTask({ key, value: userTasks[key] }, { logger })
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

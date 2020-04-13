/**
 * Tasks are things that rad executes.
 *
 * Task, either a
 *   - string, or
 *   - Taskerooni (fully defined _userland task)
 *
 * RadTask, internal task representation
 */
import * as path from "https://deno.land/std/node/path.ts";
import * as errors from "./errors.ts";
import { logger } from "./logger.ts";
import * as fs from "./util/fs.ts";
import { sh } from "./util/sh.ts";
import { timer } from "./util/timer.ts";

export enum TASK_STATES {
  IDLE = "IDLE",
  RUNNING_WAITING_UPSTREAM = "RUNNING_WAITING_UPSTREAM",
  RUNNING_ACTIVE = "RUNNING_ACTIVE",
  FINISHED_OK = "FINISHED_OK",
  FINISHED_NOT_OK = "FINISHED_NOT_OK",
}
export type TaskState = keyof typeof TASK_STATES;

export type TaskFn<T = any> = (input: {
  Deno: typeof Deno;
  fs: typeof fs;
  sh: typeof sh;
  dependentResults: any[]; // @todo add _sweet_ generics to unpack dependent result types
  logger: typeof logger;
  path: typeof path;
  task: RadTask;
}) => void | T | Promise<T | void>;

export type Task = string | Taskerooni;

/**
 * Maximally expressive, user-definable task.
 * Use me in your rad.ts!
 */
export type Taskerooni<T=any> = {
  cmd?: string;
  dependsOn?: Task[];
  fn?: TaskFn;
  specialized?: T;
}

export const asTaskerooni = (task: Task): Taskerooni =>
  typeof task === 'string'
    ? { fn: ({ sh }) => sh(task) } as Taskerooni
    : task

type TaskReport = {
  message: string;
  timing: {
    active: number;
    dependents: number;
    total: number;
  };
};

export type RadTask<T = {}> = {
  cmd?: string;
  complete?: Promise<any>;
  dependsOn?: RadTask[];
  fn: TaskFn;
  kind?: string;
  name: string;
  report?: TaskReport;
  specialized?: T;
  state: TaskState;
};

/**
 * creates a Task from a UserTask, without `dependsOn`
 */
export function getParialFromUserTask(
  { key, value }: { key: string; value: any },
): RadTask {
  if (!key) throw new errors.RadInvalidTaskError(`missing task key`);
  if (!value) {
    throw new errors.RadInvalidTaskError(`missing task value for key "${key}"`);
  }
  // @todo schema validate
  const validated: Taskerooni = typeof value === 'string'
    ? asTaskerooni(value)
    : value as Taskerooni;
  const task: RadTask = {
    ...validated,
    dependsOn: [],
    fn: validated.fn || ((() => {}) as TaskFn), // other task types are responsible for overwriting this
    name: key,
    state: TASK_STATES.IDLE,
  };
  return task;
}

export async function execute(task: RadTask) {
  const dependents = task.dependsOn || [];
  const getTotalDuration = timer();
  const getDependentsDuration = timer();
  if (task.complete) return task.complete;
  task.complete = async function executeToComplete() {
    task.state = TASK_STATES.RUNNING_WAITING_UPSTREAM;
    const dependentResults: any[] = await Promise.all(
      dependents.map((dependent) => execute(dependent)),
    );
    const dependentsDuration = getDependentsDuration();
    const getActiveDuration = timer();
    task.state = TASK_STATES.RUNNING_ACTIVE;
    try {
      var result = await Promise.resolve(
        task.fn({
          Deno,
          dependentResults,
          fs,
          logger,
          path,
          sh,
          task,
        }),
      );
      task.state = TASK_STATES.FINISHED_OK;
      return result;
    } catch (error) {
      const err = error instanceof Error
        ? error
        : { message: `non-Error entity thrown: ${String(error)}`, stack: "" };
      task.state = TASK_STATES.FINISHED_NOT_OK;
      throw new errors.RadTaskCmdExecutionError(
        err.stack || "stack unavailable",
      );
    } finally {
      task.report = {
        timing: {
          active: getActiveDuration(),
          dependents: dependentsDuration,
          total: getTotalDuration(),
        },
        message: TASK_STATES.FINISHED_OK ? "ok" : "not ok",
      };
    }
  }();
  return task.complete!;
}

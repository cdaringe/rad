/**
 * Tasks are things that rad executes.
 *
 * Task, either a
 *   - string, or
 *   - Funcarooni
 *   - Commandarooni
 *   - Makearooni
 *
 * RadTask, internal task representation
 */
import * as path from "https://deno.land/std/node/path.ts";
import * as errors from "./errors.ts";
import * as fs from "./util/fs.ts";
import { sh } from "./util/sh.ts";
import { timer } from "./util/timer.ts";
import { glob } from "./util/glob.ts";
import * as iter from "./util/iterable.ts";
import { WalkEntry } from "https://deno.land/std/fs/walk.ts";
import { Logger, WithLogger } from "./logger.ts";
import { italic, bold } from "https://deno.land/std/fmt/colors.ts";
const noop = (a: any, b: any) => {};

export enum TASK_STATES {
  IDLE = "IDLE",
  RUNNING_WAITING_UPSTREAM = "RUNNING_WAITING_UPSTREAM",
  RUNNING_ACTIVE = "RUNNING_ACTIVE",
  FINISHED_OK = "FINISHED_OK",
  FINISHED_NOT_OK = "FINISHED_NOT_OK",
}
export type TaskState = keyof typeof TASK_STATES;

export type Toolkit = {
  Deno: typeof Deno;
  fs: typeof fs;
  sh: typeof sh;
  dependentResults: any[]; // @todo add _sweet_ generics to unpack dependent result types
  logger: Logger;
  path: typeof path;
  task: RadTask;
  iter: typeof iter;
};
export type TaskFn<A2 = undefined> = (
  toolkit: Toolkit,
  arg: A2,
) => any;

/**
 * Maximally expressive, user-definable task.
 * Use me in your rad.ts!
 */
export type Task = Funcarooni | Commandarooni | Makearooni;

export type Dependarooni = {
  dependsOn?: Task[];
};

/**
 *
 */
export type Funcarooni = Dependarooni & {
  fn: TaskFn;
};
export type Commandarooni = string | (Dependarooni & {
  cmd: string;
});

/**
 * a make task needs prereqs
 */
export type Makearooni = Dependarooni & {
  target: string;
  cwd?: string;
  /**
   * globs, filenames, of input files that will be considered as inputs to
   * building the target
   */
  prereqs: string[];
  onMake: TaskFn<{
    /**
     * prereqs that have been modified since the target has been modified.
     * all prereqs are passed if the target is missing, phony, or older than
     * all prereqs.
     */
    changedPrereqs: AsyncIterable<WalkEntry>;
    /**
     * all prereqs, regardless of if they are older than the target
     */
    prereqs: AsyncIterable<WalkEntry>;
    /**
     * a sugar function that collects all items in the `prereqs` iterator,
     * and maps into the filenames for prereq (vs the full file data)
     */
    getPrereqFilenames: () => Promise<string[]>;
    /**
     * a sugar function that collects changed items in the `prereqs` iterator,
     * and maps into the filenames for prereq (vs the full file data)
     */
    getChangedPrereqFilenames: () => Promise<string[]>;
  }>;
};
// make task
/**
 * target: bundle.es5.js
 * files?: entry.esnext.js 'lib\**\*.js'
 * dependsOn?: [otherThing]
 */

export const makearooniToFuncarooni: (task: Makearooni) => Funcarooni = (
  task,
) => {
  const { target, onMake, prereqs = [], cwd = ".", ...rest } = task;
  const funcer: Funcarooni = {
    fn: async function makeTaskFn(toolkit) {
      const targetWalkEntry: WalkEntry = await glob(cwd, target).next().then(
        (res) => res.value,
      );
      const targetModified = targetWalkEntry?.info?.modified || -1;
      const getPrereqs = async function* getMakePrereqs(
        filter: (predicate: WalkEntry) => boolean,
      ): AsyncIterable<WalkEntry> {
        for (const prereq of prereqs) {
          for await (const walkEntry of glob(cwd, prereq)) {
            if (filter(walkEntry)) yield walkEntry;
          }
        }
      };
      const changedPrereqs = () =>
        getPrereqs((walkEntry) => {
          const { created, modified } = walkEntry.info;
          const isPrereqChanged = (modified || created || 0) >= targetModified;
          return isPrereqChanged;
        });
      return onMake(
        toolkit,
        {
          prereqs: getPrereqs((i) => !!i),
          changedPrereqs: changedPrereqs(),
          getPrereqFilenames: () =>
            iter.toArray(getPrereqs((i) => !!i)).then((reqs) =>
              reqs.map((req) => req.filename)
            ),
          getChangedPrereqFilenames: () =>
            iter.toArray(changedPrereqs()).then((reqs) =>
              reqs.map((req) => req.filename)
            ),
        },
      );
    },
    ...rest,
  };
  return funcer;
};

export const asFuncarooni = (
  task: Task,
  { logger }: WithLogger,
): Funcarooni => {
  if (typeof task === "string") {
    return { fn: ({ sh }) => sh(task, { logger }) } as Funcarooni;
  } else if ("cmd" in task) {
    const { cmd, ...rest } = task;
    return { fn: ({ sh }) => sh(task.cmd, { logger }), ...rest } as Funcarooni;
  } else if ("prereqs" in task) {
    return makearooniToFuncarooni(task);
  } else {
    return task;
  }
};

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
  { logger }: WithLogger,
): RadTask {
  if (!key) throw new errors.RadInvalidTaskError(`missing task key`);
  if (!value) {
    throw new errors.RadInvalidTaskError(`missing task value for key "${key}"`);
  }
  // @todo schema validate
  const validated: Exclude<Task, string> = asFuncarooni(value, { logger });
  const task: RadTask = {
    ...validated,
    dependsOn: [],
    fn: (("fn" in validated && validated.fn) || noop) as TaskFn, // other task types are responsible for overwriting this
    name: key,
    state: TASK_STATES.IDLE,
  };
  return task;
}

export async function execute(task: RadTask, { logger }: WithLogger) {
  const dependents = task.dependsOn || [];
  const getTotalDuration = timer();
  const getDependentsDuration = timer();
  if (task.complete) return task.complete;
  task.complete = async function executeToComplete() {
    task.state = TASK_STATES.RUNNING_WAITING_UPSTREAM;
    logger.info(`${bold(task.name)} ${italic("start")}`);
    const dependentResults: any[] = await Promise.all(
      dependents.map((dependent) => execute(dependent, { logger })),
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
          iter,
          path,
          sh: (cmd, opts) => sh(cmd, { logger, ...opts }),
          task,
        }, undefined),
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
      const { message, timing: { active, total } } = task.report!;
      logger.info(
        `${bold(task.name)} ${italic(
          "end",
        )} : ${message} : active ${active} (${((active / total) * 100).toFixed(
          0,
        )}%): total ${total} `,
      );
    }
  }();
  return task.complete!;
}

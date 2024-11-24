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
import * as errors from "./errors.ts";
import * as fsU from "./util/fs.ts";
import { sh } from "./util/sh.ts";
import { timer } from "./util/timer.ts";
import { glob } from "./util/glob.ts";
import * as iter from "./util/iterable.ts";
import type { Logger, WithLogger } from "./logger.ts";
import { colors, fs, path } from "./3p/std.ts";
import { getReRoot } from "./util/reroot.ts";

type WalkEntry = fs.WalkEntry;
const { italic, bold, green, red } = colors;
// deno-lint-ignore no-explicit-any
const noop = (..._args: any[]) => {};
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export enum TASK_STATES {
  IDLE = "IDLE",
  RUNNING_WAITING_UPSTREAM = "RUNNING_WAITING_UPSTREAM",
  RUNNING_ACTIVE = "RUNNING_ACTIVE",
  FINISHED_OK = "FINISHED_OK",
  FINISHED_NOT_OK = "FINISHED_NOT_OK",
}
export type TaskState = keyof typeof TASK_STATES;

export type Toolkit = {
  /**
   * Deno API
   * {@link https://doc.deno.land/https/github.com/denoland/deno/releases/latest/download/lib.deno.d.ts deno-api}
   */
  Deno: typeof Deno;
  fs: fsU.FsUtil;
  sh: typeof sh;
  dependentResults: unknown[]; // @todo add _sweet_ generics to unpack dependent result types
  logger: Logger;
  path: typeof path;
  task: RadTask;
  iter: typeof iter;
  sleep: typeof sleep;
};

// deno-lint-ignore no-explicit-any
export type TaskFn<A2 = undefined, R = any> = (
  toolkit: Toolkit,
  arg: A2,
) => Promise<R> | R;

/**
 * Maximally expressive, user-definable task.
 * Use me in your rad.ts!
 */
export type Task = Dependarooni | Funcarooni | Commandarooni | Makearooni;

export type Dependarooni = {
  name?: string;
  dependsOn?: Task[];
  dependsOnSerial?: boolean;
};

/** */
export type Funcarooni = Dependarooni & {
  fn: TaskFn;
};
export type Commandarooni =
  | [name: string, cmd: string]
  | (Dependarooni & {
    cmd: string;
  });

/**
 * a make task needs prereqs
 */
export type Makearooni =
  & Dependarooni
  & ({
    target: string;
  } | {
    mapPrereqToTarget: (
      opts: {
        prereq: string;
        cwd: string;
        reroot: (
          oldRoot: string,
          newRoot: string,
          oldExt: string,
          newExt: string,
        ) => string;
        toolkit: Toolkit;
      },
    ) => string;
  })
  & {
    cwd?: string;
    /**
     * globs, filenames, of input files that will be considered as inputs to
     * building the target
     */
    prereqs: string[];
    onMake: TaskFn<{
      target?: string;
      getTarget?: (we: fs.WalkEntry) => string;
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

const getModifiedTimeOrVeryOld = (filename: string) =>
  filename
    ? Deno.stat(filename).then(({ mtime }) => Number(mtime) || -1).catch(() =>
      -1
    )
    : -1;

export const makearooniToFuncarooni: (task: Makearooni) => Funcarooni = (
  task,
) => {
  const { onMake, prereqs = [], cwd = ".", ...rest } = task;
  const funcer: Funcarooni = {
    fn: function makeTaskFn(toolkit) {
      const getPrereqs = async function* getMakePrereqs(
        filter: (predicate: WalkEntry) => Promise<boolean>,
      ): AsyncIterable<WalkEntry> {
        for (const prereq of prereqs) {
          toolkit.logger.debug(`globbing at ${cwd} + ${prereq}`);
          for await (
            const walkEntry of glob(
              { root: cwd, pattern: prereq, logger: toolkit.logger },
            )
          ) {
            toolkit.logger.debug(`entry found: ${walkEntry.name}`);
            if (await filter(walkEntry)) yield walkEntry;
          }
        }
      };
      const changedPrereqs = () =>
        getPrereqs(async (walkEntry) => {
          const {
            birthtime: created = new Date(0),
            mtime: modified = new Date(0),
          } = await Deno.stat(walkEntry.path);
          const targetPath = "target" in task
            ? await glob(
              { root: cwd, pattern: task.target, logger: toolkit.logger },
            ).next().then((
              res: IteratorResult<fs.WalkEntry, unknown>,
            ) => res.done ? "" : res.value.path)
            : await Promise.resolve(
              task.mapPrereqToTarget(
                {
                  prereq: walkEntry.path,
                  cwd,
                  reroot: getReRoot(walkEntry.path),
                  toolkit,
                },
              ),
            );
          if ("mapPrereqToTarget" in task) {
            toolkit.logger.debug(
              `mapPrereqToTarget: ${walkEntry.path} => ${targetPath}`,
            );
          }
          const targetChangedTime = await getModifiedTimeOrVeryOld(targetPath);
          const preReqChangedTime = Number(modified) || Number(created) || 0;
          const isPrereqChanged = preReqChangedTime >=
            targetChangedTime;
          if (isPrereqChanged) {
            toolkit.logger.debug(`prereq triggered task. ${
              JSON.stringify({
                prereq: {
                  path: walkEntry.path,
                  modified,
                  created,
                },
                target: {
                  path: targetPath,
                  modified: targetChangedTime,
                },
              })
            }`);
          }
          return isPrereqChanged;
        });
      return onMake(
        toolkit,
        {
          target: "target" in task ? task.target : undefined,
          getTarget: "mapPrereqToTarget" in task
            ? (walkEntry: fs.WalkEntry) =>
              task.mapPrereqToTarget({
                prereq: walkEntry.path,
                cwd,
                reroot: getReRoot(walkEntry.path),
                toolkit,
              })
            : undefined,
          prereqs: getPrereqs((i) => Promise.resolve(!!i)),
          changedPrereqs: changedPrereqs(),
          getPrereqFilenames: () =>
            iter.toArray(getPrereqs((i) => Promise.resolve(!!i))).then((reqs) =>
              reqs.map((req) => req.path)
            ),
          getChangedPrereqFilenames: () =>
            iter.toArray(changedPrereqs()).then((reqs) =>
              reqs.map((req) => req.path)
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
  if (Array.isArray(task)) {
    return {
      name: task[0],
      fn: ({ sh }) => sh(task[1], { logger }),
    } as Funcarooni;
  } else if ("cmd" in task) {
    const { cmd: _cmd, ...rest } = task;
    return { fn: ({ sh }) => sh(task.cmd, { logger }), ...rest } as Funcarooni;
  } else if ("prereqs" in task) {
    return makearooniToFuncarooni(task);
  } else {
    return "fn" in task ? task : { ...task, fn: noop };
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

export type RadTask<Result = unknown> = {
  cmd?: string;
  complete?: Promise<Result>;
  dependsOn?: RadTask[];
  dependsOnSerial?: boolean;
  fn: TaskFn;
  kind?: string;
  alias: string;
  name: string;
  report?: TaskReport;
  state: TaskState;
};

type PartialWithArray<T> = T extends any[] ? T : Partial<T>;

/**
 * creates a RadTask from a Task (a user provided task), without
 * `dependsOn` hydrated
 */
export function getPartialFromUserTask(
  { key, value }: { key: string; value: PartialWithArray<Task> },
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
    alias: key,
    dependsOn: [],
    fn: (("fn" in validated && validated.fn) || noop) as TaskFn, // other task types are responsible for overwriting this
    name:
      (Array.isArray(value)
        ? value[0]
        : typeof value === "object"
        ? value.name
        : undefined) ??
        key,
    state: TASK_STATES.IDLE,
  };
  return task;
}

export async function executeDependents(
  task: RadTask,
  logger: Logger,
): Promise<unknown[]> {
  const { dependsOn = [], dependsOnSerial } = task;
  if (dependsOnSerial) {
    const results: unknown[] = [];
    for (const dependent of dependsOn) {
      results.push(await execute(dependent, { logger }));
    }
    return results;
  }
  return Promise.all(
    dependsOn.map((dependent) => execute(dependent, { logger })),
  );
}
export function execute(task: RadTask, { logger }: WithLogger) {
  const getTotalDuration = timer();
  const getDependentsDuration = timer();
  if (task.complete) return task.complete;
  task.complete = async function executeToCompletion() {
    task.state = TASK_STATES.RUNNING_WAITING_UPSTREAM;
    logger.info(`${bold(task.name)} ${italic("start")}`);
    const dependentResults: unknown[] = await executeDependents(task, logger);
    const dependentsDuration = getDependentsDuration();
    const getActiveDuration = timer();
    let result: undefined | unknown;
    task.state = TASK_STATES.RUNNING_ACTIVE;
    try {
      const toolkit: Toolkit = {
        Deno,
        dependentResults,
        fs: fsU.createFsUtil({ logger }),
        logger,
        iter,
        path,
        sh: (cmd, opts) => sh(cmd, { logger, ...opts }),
        sleep,
        task,
      };
      result = await Promise.resolve(task.fn(toolkit, undefined));
      task.state = TASK_STATES.FINISHED_OK;
      return result;
    } catch (error) {
      logger.debug(`task ${task.name} \`fn\` - rejected`);
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
        message: task.state === TASK_STATES.FINISHED_OK
          ? green("ok")
          : red("not ok"),
      };
      logReport(task, logger);
    }
  }();
  return task.complete!;
}

const logReport = (task: RadTask, logger: Logger) => {
  const { message, timing: { active, total } } = task.report!;
  logger.info(
    `${bold(task.name)} ${
      italic(
        "end",
      )
    } : ${message} : active ${active} ms (${
      ((active / total) * 100)
        .toFixed(
          0,
        )
    }%): total ${total} ms `,
  );
};

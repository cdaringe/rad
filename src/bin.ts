#!/usr/bin/env deno
import * as errors from "./errors.ts";
import * as rad from "./mod.ts";
import { parse, Args } from "https://deno.land/std/flags/mod.ts";
import { last } from "./util/last.ts";
import { createLogger, Logger } from "./logger.ts";
import { execute } from "./Task.ts";
import { Task } from "./Radness.ts";

const flags = {
  alias: {
    "help": ["h"],
    "radfile": ["r"],
    "log-level": ["l"],
    "init": [],
    "list": [],
  },
  boolean: [
    "help",
  ],
};
const parsed = parse(Deno.args);

const helpText = `
rad: a general-purpose, typed & portable build tool.

   Usage
     $ rad <task-name> [flags]

   Options
    --init  create a new rad file template in current working directory
    --radfile, -r  path/to/rad.ts
    --help, -h  this very help menu
    --log-level, -l log level (debug,info,warning,error,critical)
    --tasks  list tasks

   Examples
     $ rad
     $ rad -r /path/to/rad.ts
     $ rad -l info test
`;

export function assertFlags(userFlags: { [key: string]: any }) {
  const aliases = Object.values(flags.alias).flatMap((i) => i);
  const fullFlags = Object.keys(flags.alias);
  const permitted = [...aliases, ...fullFlags];
  const flagNames = Object.keys(userFlags);
  const present = new Set(flagNames);
  const nonStringyFlags = flagNames.reduce((acc, flagName) => {
    const typename = typeof userFlags[flagName];
    return [
      ...acc,
      ...((typename === "string" || typename === "boolean")
        ? []
        : [[flagName, typename]]),
    ];
  }, [] as string[][]);
  if (nonStringyFlags.length) {
    throw new errors.RadError(
      `expected string or boolean values for flag: ${JSON.stringify(
        nonStringyFlags,
      )}`,
    );
  }
  permitted.forEach((key) => present.delete(key));
  if (present.size) {
    throw new errors.RadError(
      `invalid CLI args detected: ${Array.from(present).join(", ")}`,
    );
  }
}

export type RadExecResult = {
  task?: Task;
  taskName?: string;
  result?: any;
  logger?: Logger;
};

export async function suchRad(args: Args): Promise<RadExecResult> {
  if (args.help || args.h) {
    console.info(helpText);
    return {};
  }
  const { _, ...flags } = args;
  assertFlags(flags);
  const logger = await createLogger(args["log-level"] || args.l);
  if (args.init) {
    await rad.createRadfile(Deno.cwd());
    return {};
  }
  var taskName = last(args._) as string;
  var radness = await rad.init({
    radFilename: args.radfile || args.r,
    logger,
  });

  var tree = rad.createTaskGraph(radness, { logger });
  if (args.list) {
    console.log(`${Object.keys(tree.graph).sort().join("\n")}`);
    return {};
  }
  if (!taskName) throw new errors.RadError(`no task name provided`);
  const task = tree.graph[taskName];
  if (!task) throw new errors.RadError(`no task "${taskName}" found`);
  logger.info(`executing task: "${taskName}"`);
  const result = await execute(task, { logger });
  return {
    task,
    taskName,
    result,
    logger,
  };
}

if (import.meta.main) suchRad(parsed).catch(errors.onFail);

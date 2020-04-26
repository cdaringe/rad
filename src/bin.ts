#!/usr/bin/env deno
import * as errors from "./errors.ts";
import * as rad from "./mod.ts";
import { parse, Args } from "https://deno.land/std/flags/mod.ts";
import { last } from "./util/last.ts";
import { createLogger } from "./logger.ts";
import { execute } from "./Task.ts";

const flags = {
  alias: {
    "help": ["h"],
    "radfile": ["r"],
    "log-level": ["l"],
    "init": [],
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

   Examples
     $ rad
     $ rad -r /path/to/rad.ts
     $ rad -l info test
`;

export function assertFlags(userFlags: { [key: string]: any }) {
  const aliases = Object.values(flags.alias).flatMap((i) => i);
  const fullFlags = Object.keys(flags.alias);
  const permitted = [...aliases, ...fullFlags];
  const present = new Set(Object.keys(userFlags));
  permitted.forEach((key) => present.delete(key));
  if (present.size) {
    throw new errors.RadError(
      `invalid CLI args detected: ${Array.from(present).join(", ")}`,
    );
  }
}

async function suchRad(args: Args) {
  if (args.help || args.h) {
    return console.info(helpText);
  }
  const { _, ...flags } = args;
  assertFlags(flags);
  const logger = await createLogger(args["log-level"]);
  var taskName = last(args._);
  if (args.init) return rad.createRadfile(Deno.cwd());
  var radness = await rad.init({
    radFilename: args.radfile,
    logger,
  });

  var tree = rad.createTaskGraph(radness, { logger });
  if (!taskName) throw new errors.RadError(`no task name provided`);
  const task = tree.graph[taskName];
  if (!task) throw new errors.RadError(`no task "${taskName}" found`);
  logger.info(`executing task: "${taskName}"`);
  await execute(task, { logger });
}

if (import.meta.main) suchRad(parsed).catch(errors.onFail);

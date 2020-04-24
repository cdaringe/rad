#!/usr/bin/env deno
import * as errors from "./errors.ts";
import * as rad from "./mod.ts";
import { parse, Args } from "https://deno.land/std/flags/mod.ts";
import { last } from "./util/last.ts";
import { createLogger } from "./logger.ts";
import { execute } from "./Task.ts";

const parsed = parse(Deno.args, {
  alias: {
    "help": ["h"],
    "radfile": ["r"],
    "logLevel": ["l"],
  },
  boolean: [
    "help",
  ],
});

const helpText = `
rad: a general-purpose, typed & portable build tool.

   Usage
     $ rad <task-name>
     $ rad init  # create a new rad file template in current working directory

   Options
     --radfile, -r  path/to/rad.ts
     --init, create  a default rad.ts
     --help, -h  this very help menu
     --log-level, -l log leve (debug,info,warning,error,critical)

   Examples
     $ rad
     $ rad -r /path/to/rad.ts

`;

async function suchRad(args: Args) {
  if (args.help || args.h) {
    return console.info(helpText);
  }
  const logger = await createLogger(args.logLevel);
  var requestedTaskName = last(args._);
  if (args.init) return rad.createRadfile(Deno.cwd());
  var radness = await rad.init({
    radFilename: args.radfile,
    logger,
  });

  var tree = rad.createTaskGraph(radness, { logger });
  if (!requestedTaskName) logger.info('no task requested, trying "build"');
  const taskName = requestedTaskName || "build";
  const task = tree.graph[taskName];
  logger.info(`executing task: "${taskName}"`);
  if (!task) throw new errors.RadError(`no task "${taskName}" found`);
  await execute(task, { logger });
}

if (import.meta.main) suchRad(parsed).catch(errors.onFail);

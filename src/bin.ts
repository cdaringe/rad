#!/usr/bin/env deno
import * as errors from "./errors.ts";
import * as rad from "./mod.ts";
import { parse, Args } from "https://deno.land/std/flags/mod.ts";
import { last } from "./util/last.ts";
import { logger } from "./logger.ts";
import { execute } from "./Task.ts";

const parsed = parse(Deno.args, {
  alias: {
    "help": ["-h"],
    "radfile": ["r"],
  },
  boolean: [
    'help'
  ]
});


const helpText = `
rad: a general-purpose, typed & portable build tool.

   Usage
     $ rad <task-name>
     $ rad init  # create a new rad file template in current working directory

   Options
     --radfile, -r  path/to/rad.ts
     --init, create  a default rad.ts
     --help, -h this  very help menu

   Examples
     $ rad
     $ rad -r /path/to/rad.ts

`

async function suchRad(args: Args) {
  if (args.help || args.h) {
    return console.info(helpText)
  }
  var requestedTaskName = last(args._);
  if (args.init) return rad.createRadfile(Deno.cwd());
  var radness = await rad.init({
    radFilename: args.radfile,
  });

  var tree = rad.createTaskGraph(radness);

  logger.info("no task requested, trying \"build\"")
  const taskName = requestedTaskName || "build";
  const task = tree.graph[taskName]
  if (!task) throw new errors.RadError(`no task "${taskName}" found`)
  await execute(task);
}

if (import.meta.main) suchRad(parsed).catch(errors.onFail);

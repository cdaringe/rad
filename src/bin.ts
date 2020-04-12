#!/usr/bin/env deno
import * as errors from "./errors.ts";
import * as rad from "./mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import { last } from "./util/last.ts";
import { logger } from "./logger.ts";
import { execute } from "./Task.ts";

const args = parse(Deno.args, {
  alias: {
    "radfile": ["r"],
  },
});

// var cli = meow(
//   `
//   Usage
//     $ rad <task>
//     $ rad init # create a new rad file template in current working directory

//   Options
//     --radfile, -r  path/to/radfile

//   Examples
//     $ rad
//     $ rad -r /path/to/rad.js
// `,
//   {
//     flags: {
//       radfile: {
//         type: 'string',
//         alias: 'r'
//       }
//     }
//   }
// )

async function suchRad() {
  // eslint-disable-line
  var requestedTaskName = last(args._);
  if (args.init) return rad.createRadfile(Deno.cwd());
  logger.debug(`initializing the radness`);
  var radness = await rad.init({
    radFilename: args.radfile,
  });
  var tree = rad.createTaskGraph(radness);
  const taskName = requestedTaskName || "build";
  logger.info(`selecting task ${taskName}`);
  await execute(tree.graph[taskName]);
}

suchRad().catch(errors.onFail);

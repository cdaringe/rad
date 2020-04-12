import * as path from "https://deno.land/std/node/path.ts";
import * as errors from "./errors.ts";
import { Task } from "./Task.ts";
import { Radness, from } from "./Radness.ts";
// var TaskMake = require('./TaskMake')
import * as taskGraph from "./TaskGraph.ts";

var DEFAULT_RADFILENAME = path.resolve("rad.ts");

export async function getRadFilename(radFilename: string) {
  if (radFilename) {
    radFilename = path.isAbsolute(radFilename)
      ? radFilename
      : path.resolve(radFilename);
    if (!await Deno.lstat(radFilename).catch(() => false)) {
      throw new errors.RadMissingRadFile(
        `cannot read radfile "${radFilename}". does it exist?`,
      );
    }
    return radFilename;
  }
  var radFileExists = await Deno.lstat(DEFAULT_RADFILENAME).catch(() => false);
  if (!radFileExists) {
    throw new errors.RadMissingRadFile(
      [`cannot find radfile "${DEFAULT_RADFILENAME}"`].join(""),
    );
  }
  return DEFAULT_RADFILENAME;
}

export type InitOptions = {
  radFilename: string;
};
export async function init(opts?: InitOptions) {
  if (["object", "undefined"].indexOf(typeof opts) === -1) {
    throw new errors.RadError("invalid first argument to rad.init(...)");
  }
  opts = opts || { radFilename: "" };
  var radFilename = await getRadFilename(opts.radFilename);
  return import(radFilename).then((mod) => from(mod));
}

export function createRadfile(targetDirname: string) {
  return Deno.copyFile(
    path.resolve(import.meta.url, "../assets/rad.ts"),
    path.resolve(targetDirname, "rad.ts"),
  );
}

export function createTaskGraph(radness: Radness) {
  if (!radness) throw new errors.RadError("no radness passed to createGraph");
  if (!radness.tasks) {
    throw new errors.RadNoTasksError("no tasks defined in radfile");
  }
  return taskGraph.fromTasks(radness.tasks);
}

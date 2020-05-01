import * as errors from "./errors.ts";
import * as taskGraph from "./TaskGraph.ts";
import { Logger, WithLogger } from "./logger.ts";
import { Task } from "./Task.ts";
import { Radness, from } from "./Radness.ts";
import { path } from "./3p/std.ts";

var DEFAULT_RADFILENAME = path.resolve("rad.ts");

export async function getRadFilename({ radFilename, logger }: InitOptions) {
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
  var radFileExists = await Deno.lstat(DEFAULT_RADFILENAME).catch((err) => {
    logger.debug(err);
    false;
  });
  if (!radFileExists) {
    throw new errors.RadMissingRadFile(
      [`cannot find radfile "${DEFAULT_RADFILENAME}"`].join(""),
    );
  }
  return DEFAULT_RADFILENAME;
}

export type InitOptions = {
  radFilename: string;
  logger: Logger;
};
export async function init(opts: InitOptions) {
  var radFilename = await getRadFilename(opts);
  return import(radFilename).then((mod) => from(mod));
}

export function createRadfile(targetDirname: string, { logger }: WithLogger) {
  const dirname = path.dirname(import.meta.url.replace("file://", ""));
  const src = path.resolve(dirname, "../assets/rad.ts");
  logger.info(`copy radfile from ${src} (dirname: ${dirname})`);
  return Deno.copyFile(src, path.resolve(targetDirname, "rad.ts"));
}

export function createTaskGraph(radness: Radness, { logger }: WithLogger) {
  if (!radness) throw new errors.RadError("no radness passed to createGraph");
  if (!radness.tasks) {
    throw new errors.RadNoTasksError("no tasks defined in radfile");
  }
  const graph = taskGraph.fromTasks(radness.tasks, { logger });
  return graph;
}

export type Tasks = Radness["tasks"];
export { Task, Radness };
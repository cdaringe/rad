import * as errors from "./errors.ts";
import * as taskGraph from "./TaskGraph.ts";
import type { Logger, WithLogger } from "./logger.ts";
import type { Task } from "./Task.ts";
import { Radness, from } from "./Radness.ts";
import { path } from "./3p/std.ts";
import { asFileUrl } from "./util/fs.ts";

var DEFAULT_RADFILENAME = path.resolve("rad.ts");

export async function getRadFilename({ radFilename, logger }: InitOptions) {
  let nextRadfilename = radFilename;
  if (radFilename) {
    nextRadfilename = path.isAbsolute(radFilename)
      ? radFilename
      : path.resolve(radFilename);
    if (!await Deno.lstat(radFilename).catch(() => false)) {
      throw new errors.RadMissingRadFile(
        `cannot read radfile "${radFilename}". does it exist?`,
      );
    }
    logger.debug(`radfile resolved from ${radFilename} to ${nextRadfilename}`);
    return nextRadfilename;
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
  return import(asFileUrl(radFilename)).then((mod) => from(mod));
}

export async function createRadfile(
  targetDirname: string,
  { logger }: WithLogger,
) {
  const src = import.meta.url.match(/http/)
    ? import.meta.url.replace("src/mod.ts", "assets/rad.ts")
    : path.resolve(
      path.dirname(import.meta.url.replace("file://", "")),
      "../assets/rad.ts",
    );
  logger.info(`copying radfile from ${src}`);
  const destFilename = path.resolve(targetDirname, "rad.ts");
  let fileContents = src.match(/http/)
    ? await fetch(src).then(
      (r) => r.text(),
    )
    : await Deno.readTextFile(src);
  const customImportUrl = Deno.env.get("RAD_IMPORT_URL");
  if (customImportUrl) {
    const toMatch = "https://deno.land/x/rad/src/mod.ts";
    if (!fileContents.match(toMatch)) {
      throw new Error(
        `failed to replace customImportUrl, unable to find ${toMatch}`,
      );
    }
    fileContents = fileContents.replace(
      toMatch,
      customImportUrl,
    );
  }
  await Deno.writeTextFile(destFilename, fileContents);
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
export type { Task, Radness };

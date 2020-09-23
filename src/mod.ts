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

export function getCustomImportUrl({
  defaultUrl,
  srcUrl,
  envUrl,
}: {
  defaultUrl: string;
  srcUrl: string;
  envUrl?: string;
}) {
  if (envUrl) return envUrl;
  const versionMatch = srcUrl.match(/(x\/rad@v\d\.\d\.\d)/);
  if (versionMatch) {
    const version = versionMatch[1];
    if (!defaultUrl.match("x/rad")) {
      throw new Error("default rad.ts asset missing x/rad in URL");
    }
    return defaultUrl.replace(/x\/rad[^\/]*/, version);
  }
  return null;
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
  const isHttpInit = src.match(/http/);
  logger.debug(`is radfile initializing from HTTP pathname?: ${isHttpInit}`);
  let fileContents = isHttpInit
    ? await fetch(src).then(
      (r) => r.text(),
    )
    : await Deno.readTextFile(src);
  const defaultUrl = "https://deno.land/x/rad/src/mod.ts";
  logger.debug(`default mod.ts url: ${defaultUrl}`);
  const customImportUrl = isHttpInit
    ? getCustomImportUrl({
      defaultUrl,
      srcUrl: src,
      envUrl: Deno.env.get("RAD_IMPORT_URL"),
    })
    : null;
  logger.debug(`custom mod.ts url? ${customImportUrl || "false"}`);
  if (customImportUrl) {
    if (!fileContents.match(defaultUrl)) {
      throw new Error(
        `failed to replace customImportUrl, unable to find ${defaultUrl}`,
      );
    }
    fileContents = fileContents.replace(
      defaultUrl,
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

#!/usr/bin/env deno
import * as errors from "./errors.ts";
import * as rad from "./mod.ts";
import { last } from "./util/last.ts";
import { createLogger, Logger } from "./logger.ts";
import { execute } from "./Task.ts";
import { asTree } from "./TaskGraph.ts";
import { flags as flagsMod } from "./3p/std.ts";
import { version } from "./version.ts";
import { path } from "./3p/std.ts";

const DEFAULT_RADFILENAME = path.resolve("rad.ts");

const flags = {
  alias: {
    "help": ["h"],
    "radfile": ["r"],
    "log-level": ["l"],
    "print-graph": ["p"],
    "init": [],
    "list": [],
    "version": ["v"],
  },
  boolean: [
    "help",
    "version",
  ],
};
const parsed = flagsMod.parse(Deno.args);

const helpText = `
rad: a general-purpose, typed & portable build tool.

   Usage
     $ rad <task-name> [flags]

   Options
    --help, -h  this very help menu
    --init  create a new rad file template in current working directory
    --log-level, -l log level (debug,info,warning,error,critical)
    --print-graph  print task graph(s). use task-name arg to print a singular graph
    --radfile, -r  path/to/rad.ts
    --list  list tasks
    --version, -v print rad version

   Examples
     $ rad
     $ rad --help
     $ rad --radfile /path/to/rad.ts
     $ rad --log-level info test
     $ rad check --print-graph
`;

export function assertFlags(userFlags: { [key: string]: unknown }) {
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
      `expected string or boolean values for flag: ${
        JSON.stringify(
          nonStringyFlags,
        )
      }`,
    );
  }
  permitted.forEach((key) => present.delete(key));
  if (present.size) {
    throw new errors.RadError(
      `invalid CLI args detected: ${Array.from(present).join(", ")}`,
    );
  }
}

export type RadExecResult<R = unknown> = {
  task?: rad.Task;
  taskName?: string;
  result?: R;
  logger?: Logger;
};

export async function suchRad(args: flagsMod.Args): Promise<RadExecResult> {
  const { _, ...flags } = args;
  assertFlags(flags);
  if (args.help || args.h) {
    console.info(helpText);
    return {};
  } else if (args.version || args.v) {
    console.info(version);
    return {};
  }
  const logger = await createLogger(args["log-level"] || args.l);
  if (args.init) {
    await rad.createRadfile(Deno.cwd(), { logger });
    return {};
  }
  const taskName = last(args._) as string;
  const radness = await rad.init({
    radFilename: args.radfile || args.r || DEFAULT_RADFILENAME,
    logger,
  });
  const tree = rad.createTaskGraph(radness, { logger });
  if (args.list || args.tasks) {
    const taskDescriptors = Object.values(tree.graph).reduce<
      Record<string, Set<string>>
    >((acc, currentTask) => {
      const alaises = acc[currentTask.name] || new Set();
      const { alias, name } = currentTask;
      if (alias !== name) {
        alaises.add(alias);
        delete acc[alias];
      }
      return {
        ...acc,
        [name]: alaises,
      };
    }, {});
    const formattedDescriptors = Object.entries(taskDescriptors).map(
      ([key, aliases]) => {
        const aliasText = aliases.size ? ` (${[...aliases].join(", ")})` : "";
        return ["  ", key, aliasText].join("");
      },
    );
    const report = ["tasks:", ...formattedDescriptors].join("\n");
    console.log(report);
    return {};
  }
  if (args["print-graph"] || args.p) {
    console.log(asTree({ logger, graph: tree, taskName }));
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

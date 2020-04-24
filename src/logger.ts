import * as log from "https://deno.land/std/log/mod.ts";
import { Logger as DenoLogger } from "https://deno.land/std/log/logger.ts";
import { blue } from "https://deno.land/std/fmt/colors.ts";
const format = await import("https://deno.land/x/date_fns/format/index.js")
  .then((mod) => mod.default);

export type WithLogger = { logger: DenoLogger };
export type Logger = DenoLogger;

export async function createLogger(level_: string = "WARNING") {
  const level = level_.toUpperCase();
  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler(level, {
        formatter: (info) => {
          return `${blue("[rad]")} ${format(
            info.datetime,
            "HH:mm:ss",
            undefined,
          )} ${info.levelName.length === 4 ? " " : ""}(${info
            .levelName
            .toLowerCase()}) ${info.msg}`;
        },
      }),
    },
    loggers: {
      rad: {
        level,
        handlers: ["console"],
      },
    },
  });

  const logger = log.getLogger("rad");
  if (!logger) throw new Error("failed to find logger");
  return logger;
}

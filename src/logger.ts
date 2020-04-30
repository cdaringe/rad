import { colors, log, logger, logLevels } from "./3p/std.ts";
import { format } from "./3p/date-fns.ts";

export type Logger = logger.Logger;
export type WithLogger = { logger: Logger };

export async function createLogger(level: logLevels.LevelName = "WARNING") {
  const nextLevel = level.toUpperCase() as logLevels.LevelName;
  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler(nextLevel, {
        formatter: (info: logger.LogRecord) => {
          return `${colors.blue("[rad]")} ${
            format(
              info.datetime,
              "HH:mm:ss",
              undefined,
            )
          } ${
            info.levelName.length === 4 ? " " : ""
          }(${info.levelName.toLowerCase()}) ${info.msg}`;
        },
      }),
    },
    loggers: {
      rad: {
        level: nextLevel,
        handlers: ["console"],
      },
    },
  });

  const logger = log.getLogger("rad");
  if (!logger) throw new Error("failed to find logger");
  return logger;
}

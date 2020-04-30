import { take } from "./3p/lodash.ts";

export class RadError extends Error {
  public static message?: string;
  public static code?: string;
  public static emoji?: string;
  public reason?: Error;
}
RadError.code = "ERADERROR";
RadError.emoji = "🚨";
export class RadMissingRadFile extends RadError {}
RadMissingRadFile.message = "unable to find radfile. does it exist?";
RadMissingRadFile.emoji = "📃";
export class RadInvalidRadFile extends RadError {}
RadInvalidRadFile.message = "invalid radfile";
RadInvalidRadFile.emoji = "☠️";
export class RadInvalidTaskError extends RadError {}
RadInvalidTaskError.emoji = RadError.emoji;
export class RadMakeTaskError extends RadInvalidTaskError {}
RadMakeTaskError.emoji = "👴";
export class RadTaskCmdFormationError extends RadInvalidTaskError {}
RadTaskCmdFormationError.emoji = RadInvalidTaskError.emoji;
RadTaskCmdFormationError.message = "task command malformed";
export class RadTaskCmdExecutionError extends RadError {}
RadTaskCmdExecutionError.emoji = RadError.emoji;
RadTaskCmdExecutionError.message = "task command failed to execute";

export class RadNoTasksError extends RadError {}
RadNoTasksError.emoji = "💣";

/**
 * bind rad friendly error handlers when running in bin mode, vs lib mode
 * @returns {undefined}
 */
export function onFail(err: any) {
  let emoji = err?.constructor?.emoji ? `${err.constructor.emoji} ` : "";
  var toLog;
  let msg = err?.message || err?.constructor?.message;
  let reason = err?.reason?.message || "";
  if (err instanceof SyntaxError) {
    emoji = RadInvalidRadFile.emoji!;
    toLog = `${emoji} syntax error detected\n\n${
      take(
        (err.stack || "").split("\n"),
        3,
      ).join("\n")
    }`;
  } else if (err instanceof RadError) {
    toLog = `${emoji} ${msg}` + (reason ? `\n${reason}` : "");
  } else {
    if (!(err instanceof Error)) {
      console.warn(
        "warning: unhandled error is not an `Error` instance. consider looking into it.",
      );
    }
    if (err === undefined || err === null) {
      err = new Error("empty, unhandled error detected");
    }
    toLog = err && err.stack;
    try {
      // stacktrace _usually_ embeds the messgae. if it doesn't, log it
      if (err.message && err.stack.indexOf(err.message) === -1) {
        console.error(err.message);
      }
    } catch (err) {
      /* pass */
    }
  }
  console.error(toLog);
  Deno.exit(1);
}

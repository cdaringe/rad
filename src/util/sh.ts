import type { Logger } from "../logger.ts";

export async function sh(
  cmd: string,
  opts?: { encoding?: "utf-8"; ignoreExitCode?: boolean; logger: Logger },
) {
  const { logger } = opts || {};
  const shell = Deno.env.get("SHELL") || "sh";
  logger?.debug([shell, "-c", cmd].join(" "));
  const proc = Deno.run({
    cmd: ["sh", "-c", cmd],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  logger?.debug(`sh: running process ${cmd}`);
  let { code } = await proc.status();
  logger?.debug(`sh: exit code ${code}`);
  if (code != 0 && !opts?.ignoreExitCode) {
    throw new Error(
      `non-zero exit code: ${code}`,
    );
  }
  proc.close();
}

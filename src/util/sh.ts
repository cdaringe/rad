import type { Logger } from "../logger.ts";

interface RadCommandOptionsExtensions {
  ignoreExitCode?: boolean;
  logger: Logger;
  shell?: string;
}

export async function sh(
  cmd: string,
  opts?: Partial<Deno.CommandOptions & RadCommandOptionsExtensions> | null,
) {
  const {
    ignoreExitCode,
    logger,
    shell: userRequestedShell,
    ...denoCommandOptions
  } = opts || {};
  const shell = userRequestedShell ?? Deno.env.get("SHELL") ?? "sh";
  logger?.debug([shell, "-c", cmd].join(" "));
  const proc = new Deno.Command(shell, {
    args: ["-c", cmd],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    ...denoCommandOptions,
  });
  logger?.debug(`sh: running process ${cmd}`);
  const result = await proc.output();
  const { code, success } = result;
  logger?.debug(`sh: exit code ${code}`);
  const isThrowing = !success && !ignoreExitCode;
  if (isThrowing) {
    throw new Error(
      `non-zero exit code: ${code}`,
    );
  }
}

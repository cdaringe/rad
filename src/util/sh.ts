import { Logger } from "https://deno.land/std/log/logger.ts";
export async function sh(
  cmd: string,
  opts?: { encoding?: "utf-8"; ignoreExitCode?: boolean; logger: Logger },
) {
  const { logger } = opts || {};
  const shell = Deno.env().SHELL || "sh";
  logger?.debug([shell, "-c", cmd].join(" "));
  const proc = Deno.run({
    cmd: ["sh", "-c", cmd],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  logger?.debug(`sh: running process ${cmd}`);
  let [stdout, stderr, { code }] = await Promise.all([
    proc.output(),
    proc.stderrOutput(),
    proc.status(),
  ]);
  logger?.debug(`sh: exit code ${code}`);
  if (code != 0 && !opts?.ignoreExitCode) {
    // @todo do better.
    if (!proc.stderr) throw new Error(`stderr not available in sh`);
    let decoder = new TextDecoder("utf-8");
    let [strOut, strErr] = [stdout, stderr].map((uintarr) =>
      decoder.decode(uintarr).trim()
    );
    throw new Error(
      `non-zero exit code: ${code}.\nstdout:\n\t${strOut}\nstderr:\n\t${strErr}`,
    );
  }
  if (!opts?.encoding) {
    if (stdout.length) {
      logger?.debug("stdout:\n");
      await Deno.stdout.write(stdout);
    }
    if (stderr.length) {
      logger?.debug("stderr:\n");
      await Deno.stderr.write(stderr);
    }
    return null;
  }
  const decoder = new TextDecoder(opts?.encoding || "utf-8");
  let text = decoder.decode(stdout);
  return text;
}

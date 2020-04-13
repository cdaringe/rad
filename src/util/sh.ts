import { logger } from "../logger.ts";

export async function sh(
  cmd: string,
  opts?: { encoding?: "utf-8"; ignoreExitCode?: boolean },
) {
  const proc = Deno.run({
    cmd: ["sh", "-c", cmd],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  logger.debug(`sh: running process ${cmd}`);
  let [stdout, stderr, { code }] = await Promise.all([
    proc.output(),
    proc.stderrOutput(),
    proc.status(),
  ]);
  logger.debug(`sh: exit code ${code}`);
  if (code != 0 && !opts?.ignoreExitCode) {
    // @todo do better.
    if (!proc.stderr) throw new Error(`stderr not available in sh`);
    let stderr = await Deno.readAll(proc.stderr);
    let decoder = new TextDecoder("utf-8");
    let error = decoder.decode(stderr).trim();
    throw new Error(`non-zero exit code: ${code} ${error}`);
  }
  if (!opts?.encoding) {
    if (stdout.length) {
      logger.info("stdout:\n");
      await Deno.stdout.write(stdout);
    }
    if (stderr.length) {
      logger.info("stderr:\n");
      await Deno.stderr.write(stderr);
    }
    return null;
  }
  const decoder = new TextDecoder(opts?.encoding || "utf-8");
  let text = decoder.decode(stdout);
  return text;
}

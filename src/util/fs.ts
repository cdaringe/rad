import type { WithLogger } from "../logger.ts";

export const isFileUrl = (filename: string) => filename.startsWith("file://");
export const asFileUrl = (filename: string) =>
  isFileUrl(filename) ? filename : `file://${filename}`;

export const createFsUtil = ({ logger }: WithLogger) => {
  async function readFile(filename: string, type?: string) {
    logger.debug(`read file: ${filename}`);
    return new TextDecoder(type || "utf-8").decode(
      await Deno.readFile(filename),
    );
  }

  const writeFile = Deno.writeTextFile;

  function mkdirp(filename: string, opts?: Deno.MkdirOptions) {
    const recursiveOpts = opts || {};
    recursiveOpts.recursive = true;
    logger.debug(`mkdirp: ${filename}`);
    return Deno.mkdir(filename, recursiveOpts);
  }

  function exists(path: string) {
    logger.debug(`exists: ${path}`);
    return Deno.stat(path).then(() => true, () => false);
  }

  /**
   * file:///path/to/file => /path/to/file
   */
  function defile(path: string) {
    return path.replace("file://", "");
  }

  return {
    df: defile,
    defile,
    exists,
    readFile,
    writeFile,
    mkdirp,
  };
};

export type FsUtil = ReturnType<typeof createFsUtil>;
export type WithFsU = { fsU: FsUtil };

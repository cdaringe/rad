import { WithLogger } from "../logger.ts";

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

  async function writeFile(filename: string, data: any) {
    logger.debug(`write file: ${filename}`);
    const encoder = new TextEncoder();
    return Deno.writeFileSync(filename, encoder.encode(data));
  }

  async function mkdirp(filename: string, opts?: any) {
    const recursiveOpts = opts || {};
    recursiveOpts.recursive = true;
    logger.debug(`mkdirp: ${filename}`);
    return Deno.mkdir(filename, recursiveOpts);
  }

  return {
    readFile,
    writeFile,
    mkdirp,
  };
};

export type FsUtil = ReturnType<typeof createFsUtil>;
export type WithFsU = { fsU: FsUtil };

import { copy } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/node/path.ts";
import { Radness } from "../../src/Radness.ts";
import { mkdirp } from "../../src/util/fs.ts";
import { createLogger } from "../../src/logger.ts";

const __dirname = path.dirname(import.meta.url).replace("file://", "");

export type Context = {
  dirname: string;
};

const mod = {
  basicDirname: path.resolve(__dirname, "basic"),
  basicTreeDirname: path.resolve(__dirname, "basic.tree"),
  basicTreeDependentDirname: path.resolve(__dirname, "basic.tree.dependent"),
  basicMakeTreeDirname: path.resolve(__dirname, "basic.make.tree"),
  deepMakeTreeDirname: path.resolve(__dirname, "deep.tree.dependent"),
  async copyContents(src: string, dest: string) {
    var files = await Deno.readdir(src);
    for await (const fileinfo of files) {
      const filename = fileinfo.name;
      if (!filename || filename === "." || filename === "..") continue;
      await copy(
        path.join(src, filename),
        path.join(dest, filename),
        { overwrite: true },
      );
    }
  },
  async createTestFolderContext() {
    var dirname = path.join(
      await Deno.makeTempDir(),
      `rad-${Math.random().toString().substr(3, 5)}`,
    );
    await mkdirp(dirname);
    return { dirname };
  },
  async destroyTestFolderContext(context: Context) {
    return Deno.remove(context.dirname);
  },
  async loadFixture(src: string, dst: string) {
    await this.copyContents(src, dst);
    var radFilename = path.resolve(dst, "rad.ts");
    var radness: Radness = await import(radFilename);
    return { radFilename, radness };
  },
  getTestLogger: () => createLogger("CRITICAL"),
  withTestLogger: { logger: await createLogger("CRITICAL") },
};

export default mod;

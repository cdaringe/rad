import type { Radness } from "../../src/mod.ts";
import { createFsUtil } from "../../src/util/fs.ts";
import { createLogger } from "../../src/logger.ts";
import { path, fs } from "../../src/3p/std.ts";

const __dirname = path.dirname(import.meta.url).replace("file://", "");

export type Context = {
  dirname: string;
};

const getTestLogger = () =>
  createLogger(Deno.env.get("TEST_LOG_LEVEL") as any ?? "CRITICAL");

const mod = {
  asTestName: (description: string, meta: { url: string }) =>
    `[${path.basename(meta.url.replace("file://", ""))}] ${description}`,
  basicDirname: path.resolve(__dirname, "basic"),
  basicTreeDirname: path.resolve(__dirname, "basic.tree"),
  basicTreeDependentDirname: path.resolve(__dirname, "basic.tree.dependent"),
  basicMakeTreeDirname: path.resolve(__dirname, "basic.make.tree"),
  deepMakeTreeDirname: path.resolve(__dirname, "deep.tree.dependent"),
  makeMultiTarget: path.resolve(__dirname, "make.multi.target"),
  async copyContents(src: string, dest: string) {
    var files = await Deno.readDir(src);
    for await (const fileinfo of files) {
      const filename = fileinfo.name;
      if (!filename || filename === "." || filename === "..") continue;
      if (fileinfo.isDirectory) {
        const targetDirname = path.join(dest, filename);
        await Deno.mkdir(targetDirname);
        await this.copyContents(path.join(src, filename), targetDirname);
      } else {
        const oldContent = await Deno.readTextFile(path.join(src, filename));
        await Deno.writeTextFile(
          path.join(dest, filename),
          oldContent.replace("../../..", Deno.cwd()), // @todo remove dirty rotten hack for locating rad mod from test dirs
        );
      }
    }
  },
  async createTestFolderContext() {
    var dirname = path.join(
      await Deno.makeTempDir(),
      `rad-${Math.random().toString().substr(3, 5)}`,
    );
    await createFsUtil({ logger: await getTestLogger() }).mkdirp(dirname);
    return { dirname, radFilename: path.join(dirname, "rad.ts") };
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
  getTestLogger,
  withTestLogger: { logger: await getTestLogger() },
};

export default mod;

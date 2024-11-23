import type { Task, Toolkit } from "../../src/mod.ts";
import { path } from "../../src/3p/std.ts";
import { emit } from "./deps.ts";
import "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

const { basename } = path.posix;

// deno-lint-ignore no-explicit-any
const marked = (globalThis as any).marked.marked;
const pruneNoSite = (str: string) => str.replaceAll(/.*NOSITE.*$/img, "");
const createSiteDir = (fs: Toolkit["fs"]) => fs.mkdirp("public");
const groupFilesByExt = (filenames: string[]) =>
  filenames.reduce(
    ({ html, md }, filename) => ({
      html: filename.match(/html$/) ? [filename, ...html] : html,
      md: (filename.match(/md$/) ? [filename, ...md] : md).toSorted(
        (a: string, b: string) => {
          const aInt = parseInt(basename(a).substr(0, 4));
          const bInt = parseInt(basename(b).substr(0, 4));
          if (Number.isNaN(b)) return -1;
          if (Number.isNaN(a)) return 1;
          return aInt - bInt;
        },
      ),
    }),
    { html: [] as string[], md: [] as string[] },
  );
const siteMarkdownToHtml: (md: string) => string = (md) =>
  marked(pruneNoSite(md));
const mdFilesToHtmlParts = (
  mdFilenames: string[],
  fs: Toolkit["fs"],
) => mdFilenames.map(async (f) => siteMarkdownToHtml(await fs.readFile(f)));

export const buildSite: Task = {
  target: "public/index.html",
  prereqs: ["assets/site/**/*.{html,md,ts,js}", "readme.md"],
  onMake: async (
    { task: _, fs, logger },
    { getChangedPrereqFilenames, getPrereqFilenames },
  ) => {
    const changed = await getChangedPrereqFilenames();
    if (!changed.length) {
      logger.info("skipped");
      return;
    }
    await createSiteDir(fs);
    const { html, md } = await getPrereqFilenames().then(groupFilesByExt);
    logger.info(`html: ${html.join(", ")}`);
    logger.info(`md: ${md.join(", ")}`);
    const mdContentsP = mdFilesToHtmlParts(md, fs);
    const htmlIndexFilename = html[0];
    if (!htmlIndexFilename) throw new Error(`html index page not found`);
    // race: read input files, write some artifacts
    const [index, indexJs, _transformsWrittenEffect, ...sections] =
      await Promise.all(
        [
          fs.readFile(htmlIndexFilename),
          emit.bundle("assets/site/index.ts").then((res) => res.code),
          emit.bundle("assets/site/supplemental-transforms.ts").then(
            async (res) => {
              await Deno.writeTextFile("public/transforms.js", res.code);
              return ""; // appease Promise.all<string> typecheck
            },
          ),
          ...mdContentsP,
        ],
      );
    await Deno.writeTextFile(
      "public/index.html",
      index
        .replace(/jsjsjs/g, indexJs)
        .replace(/bodybody/g, sections.join("\n")),
    );
  },
};

export const serveSite: Task = {
  dependsOn: [buildSite],
  fn: ({ sh }) => sh(`pnpm dlx httpster -d public`),
};

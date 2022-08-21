import type { Task, Toolkit } from "../../src/mod.ts";
import { path } from "../../src/3p/std.ts";
import { emit } from "./deps.ts";
import "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

const { basename } = path.posix;
// deno-lint-ignore no-explicit-any
const marked = (window as any).marked.marked;
const pruneNoSite = (str: string) => str.replaceAll(/.*NOSITE.*$/img, "");
const createSiteDir = (fs: Toolkit["fs"]) => fs.mkdirp("public");
const groupFilesByExt = (filenames: string[]) =>
  filenames.reduce(
    ({ html, md }, filename) => ({
      html: filename.match(/html$/) ? [filename, ...html] : html,
      md: (filename.match(/md$/) ? [filename, ...md] : md).sort(
        (a: string, b: string) =>
          parseInt(basename(a.substr(0, 4))) >
              parseInt(basename(b.substr(0, 4)))
            ? 1
            : 0,
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
const emitOpts = {
  bundle: "module" as const,
  compilerOptions: { sourceMap: false },
};

export const task: Task = {
  target: "public/index.html",
  prereqs: ["assets/site/**/*.{html,md}"],
  onMake: async ({ task: _, fs }, { getPrereqFilenames }) => {
    await createSiteDir(fs);
    const { html, md } = await getPrereqFilenames().then(groupFilesByExt);
    const mdContentsP = mdFilesToHtmlParts(["./readme.md", ...md], fs);
    const htmlIndexFilename = html[0];
    if (!htmlIndexFilename) throw new Error(`html index page not found`);
    // race: read input files, write some artifacts
    const [index, indexJs, _transformsWrittenEffect, ...sections] =
      await Promise.all(
        [
          fs.readFile(htmlIndexFilename),
          emit("assets/site/index.ts", emitOpts).then((res) =>
            Object.values(res.files)[0]
          ),
          emit("assets/site/supplemental-transforms.ts", emitOpts).then(
            async (res) => {
              const files = Object.values(res.files);
              await Deno.writeTextFile("public/transforms.js", files[0]);
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

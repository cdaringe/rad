import type { Task } from "../../src/mod.ts";
import { path } from "../../src/3p/std.ts";
import "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

const { basename } = path.posix;
// deno-lint-ignore no-explicit-any
const marked = (window as any).marked;

export const task: Task = {
  target: "public/index.html",
  prereqs: ["assets/site/**/*.{html,md}"],
  onMake: async ({ task, fs, logger }, { getPrereqFilenames }) => {
    const pruneNoSite = (str: string) => str.replaceAll(/.*NOSITE.*$/img, "");
    await fs.mkdirp("public");
    logger.info("collecting prereq filenames");
    const filenames = await getPrereqFilenames();
    logger.info(JSON.stringify(filenames));
    const { html, md } = filenames.reduce(
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
    logger.info(`reading site inputs`);
    const mdContentsP = ["./readme.md", ...md].map(async (f) =>
      marked(pruneNoSite(await fs.readFile(f)))
    );
    if (!html[0]) throw new Error(`html index not found`);
    const [index, indexJs, _transform, ...sections] = await Promise.all(
      [
        fs.readFile(html[0]),
        Deno.emit("assets/site/index.ts", {
          bundle: "esm",
        }).then((res) => {
          const files = Object.values(res.files);
          return files[0];
        }),
        Deno.emit("assets/site/supplemental-transforms.ts", {
          bundle: "esm",
        }).then((res) => {
          const files = Object.values(res.files);
          return Deno.writeTextFile("public/transforms.js", files[0]);
        }),
        ...mdContentsP,
      ],
    );
    logger.info(`writing index.html`);
    await Deno.writeTextFile(
      "public/index.html",
      index
        .replace(/jsjsjs/g, indexJs)
        .replace(/bodybody/g, sections.join("\n")),
    );
    logger.info(`fin`);
  },
};

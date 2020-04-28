import { Task, Tasks } from "./src/mod.ts";
import "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
import { path } from "./src/3p/std.ts";
const { basename } = path.posix;
const marked = (window as any).marked;

const format: Task = { fn: ({ sh }) => sh(`deno fmt`) };
const test: Task = `deno test -A`;
const site: Task = {
  target: "./public/index.html",
  prereqs: ["assets/site/**/*.{html,md}"],
  onMake: async ({ task, fs, logger }, { getPrereqFilenames }) => {
    await fs.mkdirp("public");
    logger.info("collecting prereq filenames");
    const filenames = await getPrereqFilenames();
    logger.info(JSON.stringify(filenames));
    const { html, md } = filenames.reduce(({ html, md }, filename) => ({
      html: filename.match(/html$/) ? [filename, ...html] : html,
      md: (filename.match(/md$/) ? [filename, ...md] : md).sort(
        (a, b) =>
          parseInt(basename(a.substr(0, 4))) >
          parseInt(basename(b.substr(0, 4)))
            ? 1
            : 0,
      ),
    }), { html: [] as string[], md: [] as string[] });
    logger.info(`reading site inputs`);
    const mdContentsP = ["./readme.md", ...md].map(async (f) =>
      marked(await fs.readFile(f))
    );
    const [index, ...sections] = await Promise.all(
      [fs.readFile(html[0]), ...mdContentsP],
    );
    logger.info(`writing index.html`);
    await fs.writeFile(
      "public/index.html",
      index.replace(/bodybody/g, sections.join("\n")),
    );
    logger.info(`fin`);
  },
};

const check: Task = { dependsOn: [format, test] };

export const tasks: Tasks = {
  ...{ f: format, format },
  ...{ t: test, test },
  ...{ s: site, site },
  ...{ c: check, check },
};

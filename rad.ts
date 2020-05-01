import { Task, Tasks } from "./src/mod.ts";
import "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
import { path } from "./src/3p/std.ts";
const { basename } = path.posix;
const marked = (window as any).marked;

const format: Task = { fn: ({ sh }) => sh(`deno fmt`) };
const test: Task = `deno test -A`;
const check: Task = { dependsOn: [format, test] };
const patchInstallVersion: Task = {
  fn: async ({ Deno, fs, logger }) => {
    const nextVersion = Deno.env.get("NEXT_VERSION");
    if (!nextVersion) throw new Error("NEXT_VERSION not found");
    const installScriptRelativeFilename = "assets/install.sh";
    const oldContent = await fs.readFile(installScriptRelativeFilename);
    const nextContent = oldContent.replace(
      /__RAD_VERSION__=.*/g,
      `__RAD_VERSION__=${nextVersion}`,
    );
    if (oldContent === nextContent) {
      throw new Error("failed to update install version");
    }
    logger.info(nextContent);
    await fs.writeFile(installScriptRelativeFilename, nextContent);
  },
};
const site: Task = {
  target: "public/index.html",
  prereqs: ["assets/site/**/*.{html,md}"],
  onMake: async ({ task, fs, logger }, { getPrereqFilenames }) => {
    const pruneNoSite = (str: string) => str.replace(/.*NOSITE.*$/im, "");
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
      marked(pruneNoSite(await fs.readFile(f)))
    );
    const [index, indexJs, _transform, ...sections] = await Promise.all(
      [
        fs.readFile(html[0]),
        Deno.bundle("assets/site/index.ts").then((res) => res[1]),
        Deno.bundle("assets/site/transforms.ts").then((res) =>
          fs.writeFile("public/transforms.js", res[1])
        ),
        ...mdContentsP,
      ],
    );
    logger.info(`writing index.html`);
    await fs.writeFile(
      "public/index.html",
      index
        .replace(/jsjsjs/g, indexJs)
        .replace(/bodybody/g, sections.join("\n")),
    );
    logger.info(`fin`);
  },
};
export const tasks: Tasks = {
  ...{ f: format, format },
  ...{ t: test, test },
  ...{ s: site, site },
  ...{ c: check, check },
  patchInstallVersion,
};

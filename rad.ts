import { Radness, Task } from "./src/Radness.ts";
import "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
import { basename } from "https://deno.land/std/path/posix.ts";

const marked = (window as any).marked;
const format: Task = { fn: ({ sh }) => sh(`deno fmt`) };
const genTypes: Task = `deno types > deno.d.ts`;
const test: Task = `deno test -A`
const site: Task = {
  target: "./index.html",
  prereqs: ["assets/site/**/*.{html,md}"],
  onMake: async ({ fs }, { getPrereqFilenames }) => {
    const filenames = await getPrereqFilenames();
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
    const mdContentsP = ["./readme.md", ...md].map(async (f) =>
      marked(await fs.readFile(f))
    );
    const [index, ...sections] = await Promise.all(
      [fs.readFile(html[0]), ...mdContentsP],
    );
    await fs.writeFile(
      "./index.html",
      index.replace(/bodybody/g, sections.join("\n")),
    );
  },
};

export const tasks: Radness["tasks"] = {
  ...{ genTypes, g: genTypes },
  ...{ f: format, format },
  ...{ t: test, test },
  site,
  check: {
    dependsOn: [format, test],
    fn: () => {},
  },
};

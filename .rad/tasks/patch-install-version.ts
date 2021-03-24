import type { Task } from "../../src/mod.ts";

export const task: Task = {
  fn: async ({ Deno, fs, logger }) => {
    const nextVersion = Deno.env.get("NEXT_VERSION");
    if (!nextVersion) throw new Error("NEXT_VERSION not found");
    const isNextBeta = nextVersion.match(/next/i);

    if (isNextBeta) {
      logger.warning([
        "pre-releases are _only_ installable from git, and do not receive ",
        "automated docs or install update patches. ",
        "this ensures that there are no conflicts when merging our next branch ",
        "into the main branch",
      ].join(""));
      return;
    }

    const toPatch = [
      { filename: "assets/install.sh", regex: /\d+.\d+.\d+.*/g },
      { filename: "readme.md", regex: /\d+.\d+.\d+[^/]*/g },
      { filename: "src/version.ts", regex: /\d+.\d+.\d+[^"]*/ },
      { filename: "assets/site/0005-manual.md", regex: /\d+.\d+.\d+[^/]*/g },
    ];

    for (const { filename, regex } of toPatch) {
      logger.info(`updating ${filename} with new version ${nextVersion}`);
      const oldContent = await Deno.readTextFile(filename);
      const nextContent = oldContent.replace(regex, nextVersion);
      await Deno.writeTextFile(filename, nextContent);
    }
  },
};

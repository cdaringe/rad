import type { Task } from "../../src/mod.ts";

export const task: Task = {
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
    const oldReadmeContent = await fs.readFile("readme.md");
    const nextReadmeContent = oldReadmeContent.replace(
      /rad\/releases\/download\/v\d+.\d+.\d+/g,
      `rad/releases/download/v${nextVersion}`,
    );
    await Promise.all([
      Deno.writeTextFile(installScriptRelativeFilename, nextContent),
      Deno.writeTextFile("readme.md", nextReadmeContent),
    ]);
  },
};

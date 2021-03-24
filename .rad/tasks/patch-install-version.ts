import type { Task } from "../../src/mod.ts";

export const task: Task = {
  fn: async ({ Deno, fs, logger }) => {
    const nextVersion = Deno.env.get("NEXT_VERSION");
    if (!nextVersion) throw new Error("NEXT_VERSION not found");
    const installScriptRelativeFilename = "assets/install.sh";
    const readmeFilename = "readme.md";
    const versionFilename = "src/version.ts";

    // update install scripts
    const oldContent = await fs.readFile(installScriptRelativeFilename);
    const nextContent = oldContent.replace(
      /__RAD_VERSION__=.*/g,
      `__RAD_VERSION__=${nextVersion}`,
    );
    if (oldContent === nextContent) {
      throw new Error("failed to update install version");
    }
    logger.info(
      `updated ${installScriptRelativeFilename}, patched for next version: ${nextVersion}`,
    );
    logger.info(nextContent);

    // update docs
    const oldReadmeContent = await fs.readFile(readmeFilename);
    const nextReadmeContent = oldReadmeContent.replace(
      /rad\/releases\/download\/v\d+.\d+.\d+[^/]*/g,
      `rad/releases/download/v${nextVersion}`,
    );
    logger.info(
      `updated ${readmeFilename}, patched for next version: ${nextVersion}`,
    );

    // update source
    const oldVersionContent = await fs.readFile(versionFilename);
    const nextVersionContent = oldVersionContent.replace(
      /\d+.\d+.\d+[^"]*/g,
      `${nextVersion}`,
    );
    logger.info(
      `updated ${versionFilename}, patched for next version: ${nextVersion}`,
    );
    await Promise.all([
      Deno.writeTextFile(installScriptRelativeFilename, nextContent),
      Deno.writeTextFile(readmeFilename, nextReadmeContent),
      Deno.writeTextFile(versionFilename, nextVersionContent),
    ]);
  },
};

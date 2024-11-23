import { Task } from "../../mod.ts";
import { templates as rescript } from "./workflows/lang/rescript/mod.ts";

import * as yaml from "https://deno.land/std@0.152.0/encoding/yaml.ts";

type Lang = "rescript";

export const workflows = ({ lang }: { lang: Lang }) => {
  const task: Task = {
    fn: async ({ fs }) => {
      const toWrite: Record<string, unknown> = {};
      switch (lang) {
        case "rescript":
          {
            toWrite.main = rescript.main({ setupNode: { version: 18 } });
            await fs.writeFile(
              ".releaserc",
              JSON.stringify(
                {
                  "branches": [{ name: "main" }],
                  "plugins": [
                    "@semantic-release/commit-analyzer",
                    "@semantic-release/release-notes-generator",
                    "@semantic-release/git",
                  ],
                },
                null,
                2,
              ),
            );

            toWrite.onchange = rescript.onchange({
              setupNode: { version: 18 },
            });
          }
          break;
        default:
          throw new Error(`unsupported ${lang}`);
      }
      await Promise.all(
        Object.entries(toWrite).map(async ([key, content]) => {
          await fs.mkdirp(`.github/workflows`);
          await fs.writeFile(
            `.github/workflows/${key}.yml`,
            // deno-lint-ignore no-explicit-any
            yaml.stringify(content as any, { indent: 2 }),
          );
        }),
      );
    },
  };
  return task;
};

export const readme: Task = {
  fn: async ({ fs }) => {
    await fs.writeFile(
      "readme.md",
      [
        "# libname",
        "\n",
        "description",
        "\n",
        "## usage",
        "\n",
        "## installation",
      ].join("\n"),
    );
  },
};

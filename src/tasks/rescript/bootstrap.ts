/**
 * @warn beta
 *
 * use this module directly as a radfile, or import it
 * to integrate it!
 *
 * @example
 * rad --radfile=src/tasks/rescript/bootstrap.ts bootstrap
 */

import * as github from "../github/mod.ts";
import { Task } from "../../Task.ts";

const renovate = {
  init: {
    fn: ({ fs }) =>
      fs.writeFile(
        "renovate.json",
        JSON.stringify(
          {
            "extends": ["config:base"],
            "packageRules": [
              {
                "matchUpdateTypes": ["minor", "patch", "pin", "digest"],
                "automerge": true,
              },
            ],
          },
          null,
          2,
        ),
      ),
  } as Task,
};

const git = {
  init: {
    fn: ({ sh }) => sh(`git init`),
  } as Task,
};

const npm = {
  init: (
    opts: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    } = {},
  ) => {
    const task: Task = {
      fn: async ({ sh }) => {
        await sh(`npm init -y`);
        const depSets = [
          { deps: opts.devDependencies, dev: true },
          { deps: opts.dependencies, dev: false },
        ].filter((ds) => ds.deps?.length);
        for (const { deps, dev } of depSets) {
          const toDepKv = ([name, version]: [string, string]) =>
            `"${name}@${version}"`;
          const depsStr = Object.entries(deps || {}).map(toDepKv);
          await sh(
            `npm install -${dev ? "D" : ""}E ${depsStr}`,
          );
        }
      },
    };
    return task;
  },
};

const rescriptInit: Task = {
  fn: async ({ fs }) => {
    const template = {
      "name": "libname",
      "version": "0.0.1",
      "sources": {
        "dir": "src",
        "subdirs": true,
      },
      "package-specs": {
        "module": "es6",
      },
      "suffix": ".bs.js",
      "reason": { "react-jsx": 3 },
      "bs-dependencies": [],
      "ppx-flags": [],
      "warnings": {
        "error": "+101",
      },
    };
    await Promise.all([
      fs.writeFile("bsconfig.json", JSON.stringify(template, null, 2)),
      fs.mkdirp("src").then(() =>
        fs.writeFile("src/Foo.res", `let foo = "bar"`)
      ),
    ]);
  },
};

const dependentTuples: [string, Task][] = [
  ["gitInit", git.init],
  [
    "npmInit",
    npm.init({
      devDependencies: {
        "bs-platform": "8",
        "rescript": "*",
      },
    }),
  ],
  ["githubActionRescriptWorkflows", github.workflows({ lang: "rescript" })],
  ["readme", github.readme],
  ["renovate", renovate.init],
  ["rescriptStructure", rescriptInit],
];
export const bootstrap: Task = {
  dependsOnSerial: true,
  dependsOn: dependentTuples.map(([_, task]) => task),
};

export const tasks = dependentTuples.reduce<Record<string, Task>>(
  (acc, [name, task]) => Object.assign(acc, { [name]: task }),
  {
    bootstrap,
  },
);

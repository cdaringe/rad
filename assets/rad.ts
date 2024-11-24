import type { Task, Tasks } from "https://deno.land/x/rad/src/mod.ts";

const meet: Task = ["meet", `echo "hi friend."`];

/**
 * example rad tasks
 */
export const tasks: Tasks = {
  /**
   * make-style tasks!
   */
  install: {
    target: "node_modules",
    prereqs: ["package.json"],
    onMake: ({ sh }) => sh(`npm install && touch node_modules`),
  },
  /**
   * command style tasks
   */
  build: ["build", `tsc`],
  format: ["format", `deno fmt`],
  meet,
  /**
   * function style tasks
   */
  greet: {
    dependsOn: [meet],
    fn: async (toolkit) => {
      const { fs, path, logger, Deno, sh, task } = toolkit;
      await Deno.writeTextFile("/tmp/hello", "world!");
      // intellisense check only
      // @ts-ignore
      path.resolve && path.relative && path.isAbsolute; // etc
      logger.error("crikey!");
      Deno.cwd() && Deno.pid;
      await sh(`echo "caw, caw!, ${task.name}"`);
    },
  },
};

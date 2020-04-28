import { Task, Tasks } from "../../src/mod.ts";

const build: Task = {
  fn: async ({ logger, sh }) => {
    await sh(`clang hello.c -o hello`);
    logger.info(`compile ok, assert binary`);
    await sh(`./hello`);
    logger.info("binary ok");
  },
};

export const tasks: Tasks = { build };

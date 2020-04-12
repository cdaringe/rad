import { UserTask, UserTasks } from "./src/Task.ts";

const test: UserTask = {
  fn: async ({ sh, logger }) => {
    logger.info("🎶 gettin those tests goin");
    return sh(`deno test $(fd --extension=test.ts . test/) -A`);
  },
};

const format: UserTask = {
  dependsOn: [],
  fn: ({ sh }) => sh("deno fmt src test rad.ts"),
};

export const tasks: UserTasks = {
  format,
  test,
};

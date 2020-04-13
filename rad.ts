import { Radness, Task } from "./src/Radness.ts";

const test: Task = {
  fn: async ({ sh, logger }) => {
    logger.info("🎶 gettin those tests goin");
    return sh(`deno test $(fd --extension=test.ts . test/) -A`);
  },
};

const format: Task = {
  fn: ({ sh }) => sh("deno fmt src test rad.ts"),
};

const genTypes: Task = `deno types > deno.d.ts`

export const tasks: Radness['tasks'] = {
  genTypes,
  t: genTypes, // sure, aliases. go nuts.
  format,
  test,
};

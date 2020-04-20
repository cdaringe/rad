import { Radness, Task } from "./src/Radness.ts";

const format: Task = { fn: ({ sh }) => sh(`deno fmt`) };
const genTypes: Task = `deno types > deno.d.ts`;
const test: Task = `deno test $(fd --extension=test.ts . test/) -A`;

export const tasks: Radness["tasks"] = {
  ...{ genTypes, g: genTypes },
  ...{ format, f: format },
  ...{ test, t: test },
};

import { Radness, Task } from "./src/Radness.ts";

const format: Task = { fn: ({ sh }) => sh(`deno fmt`) };
const genDenoTypes: Task = `deno types > deno.d.ts`;
const test: Task = {
  target: "phony",
  prereqs: [`test/**.test.ts`],
  async onMake({ sh }, { getPrereqs }) {
    const testFilenames = await getPrereqs().then((reqs) => reqs.join(" "));
    return sh(`deno test ${testFilenames} -A`);
  },
};

export const tasks: Radness["tasks"] = {
  ...{ genDenoTypes, g: genDenoTypes },
  ...{ f: format, format },
  ...{ t: test, test },
  check: {
    dependsOn: [format, test],
    fn: () => {},
  },
};

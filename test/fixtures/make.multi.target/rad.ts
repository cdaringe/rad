import type { Tasks } from "../../../src/mod.ts";

export const tasks: Tasks = {
  clean: ["clean", `rm -f 'out/*.*'`],
  build: {
    prereqs: ["src/*"],
    mapPrereqToTarget: ({ reroot }) => reroot("src", "out", "inext", "outext"),
    onMake() {
      throw new Error(`test must override`);
    },
  },
};

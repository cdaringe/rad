// rad.ts
import { Task, Tasks } from "../../src/mod.ts";

const install: Task = {
  target: "node_modules",
  prereqs: ["package.json"],
  onMake: async ({ sh }, { getChangedPrereqFilenames }) => {
    const changed = await getChangedPrereqFilenames();
    if (changed.length) await sh(`npm install --verbose`);
  },
};
const lint: Task = {
  dependsOn: [install],
  fn: ({ sh }) => sh(`npm run lint`),
};
const test: Task = {
  dependsOn: [install],
  fn: ({ sh }) => sh(`npm test`),
};

const ci: Task = {
  dependsOn: [lint, test],
};

export const tasks: Tasks = {
  ci,
  install,
  lint,
  test,
};

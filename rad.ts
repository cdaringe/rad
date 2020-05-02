import { Task, Tasks } from "./src/mod.ts";
import { task as site } from "./.rad/tasks/site.ts";
import { task as patchInstallVersion } from "./.rad/tasks/patch-install-version.ts";

const format: Task = { fn: ({ sh }) => sh(`deno fmt`) };
const test: Task = `deno test -A`;
const check: Task = { dependsOn: [format, test] };
export const tasks: Tasks = {
  ...{ f: format, format },
  ...{ t: test, test },
  ...{ s: site, site },
  ...{ c: check, check },
  patchInstallVersion,
};

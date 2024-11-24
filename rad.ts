import { buildSite, serveSite } from "./.rad/tasks/site.ts";
import { task as patchInstallVersion } from "./.rad/tasks/patch-install-version.ts";
import {
  coverage,
  coverageShow,
  test,
  testIntegration,
  testUnit,
} from "./.rad/tasks/test.ts";
import { Task, Tasks } from "./.rad/tasks/common.ts";

const format: Task = ["format", `deno fmt`];
const check: Task = ["check", `deno check src test`];
const lint: Task = ["lint", `deno lint .rad examples src test`];

const ci: Task = {
  dependsOn: [format, check, lint, test],
  dependsOnSerial: true,
  name: "ci",
};

export const tasks: Tasks = {
  ...{ check, c: check },
  ...{ ci },
  ...{ coverage, cov: coverage, sc: coverageShow, coverageShow },
  ...{ format, f: format },
  ...{ lint, l: lint },
  ...{ patchInstallVersion, piv: patchInstallVersion },
  ...{ serve: serveSite, serveSite },
  ...{ site: buildSite, s: buildSite },
  ...{ test, t: test },
  ...{ testIntegration, ti: testIntegration },
  ...{ testUnit, tu: testUnit },
};

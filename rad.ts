import type { Task, Tasks } from "./src/mod.ts";
import { task as site } from "./.rad/tasks/site.ts";
import { task as patchInstallVersion } from "./.rad/tasks/patch-install-version.ts";

const DENO_VERSION = Deno.version.deno;
const COVERAGE_DIRNAME = ".coverage";

const format: Task = `deno fmt`;

const testUnit: Task = {
  async fn({ sh, logger }) {
    logger.info(`:: unit tests`);
    await sh([
      `rm -rf ${COVERAGE_DIRNAME}`,
      `deno test --unstable -A --coverage=${COVERAGE_DIRNAME}`,
    ].join(" && "));
  },
};

/**
 * @warn coverage borked per https://github.com/denoland/deno/issues/10936
 */
const coverage: Task = [
  `deno coverage ${COVERAGE_DIRNAME} --lcov > ${COVERAGE_DIRNAME}/out.lcov`,
  `genhtml -o ${COVERAGE_DIRNAME}/html ${COVERAGE_DIRNAME}/out.lcov`,
].join(" && ");

const testIntegration: Task = {
  async fn({ sh, logger }) {
    if (Deno.env.get("RAD_SKIP_INTEGRATION_TESTS")) return;
    logger.info(`:: cli integration tests in docker`);
    await sh(
      `docker run --name rad-integration --rm -v $PWD:/radness --entrypoint /radness/test/integration/rad.cli.init.sh --workdir /radness denoland/deno:alpine-${DENO_VERSION}`,
    );
  },
};

const test: Task = {
  dependsOn: [testUnit, testIntegration],
  dependsOnSerial: true,
};
const lint: Task = `deno --unstable lint .rad examples src test`;
const check: Task = { dependsOn: [format, lint, test], dependsOnSerial: true };

const syncNextMain: Task =
  `git fetch origin main && git rebase origin/main && git checkout main && git merge next && git push origin main && git checkout next && git merge main`;

export const tasks: Tasks = {
  ...{ coverage, cov: coverage },
  ...{ l: lint, lint },
  ...{ f: format, format },
  ...{ t: test, test },
  ...{ testUnit, tu: testUnit, testIntegration, ti: testIntegration },
  ...{ s: site, site },
  ...{ c: check, check },
  ...{ snm: syncNextMain, syncNextMain },
  patchInstallVersion,
};

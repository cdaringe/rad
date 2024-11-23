import type { Task, Tasks } from "./src/mod.ts";
import { buildSite, serveSite } from "./.rad/tasks/site.ts";
import { task as patchInstallVersion } from "./.rad/tasks/patch-install-version.ts";

const DENO_VERSION = Deno.version.deno;
const COVERAGE_DIRNAME = ".coverage";

const format: Task = `deno fmt`;

const testUnit: Task = {
  async fn({ sh, logger }) {
    logger.info(`:: unit tests`);
    await sh([
      `rm -rf ${COVERAGE_DIRNAME}`,
      `deno test -A --coverage=${COVERAGE_DIRNAME}`,
    ].join(" && "));
  },
};

/**
 * @warn coverage borked per https://github.com/denoland/deno/issues/10936
 */
const coverage: Task = [
  `deno coverage --include="${Deno.cwd()}" ${COVERAGE_DIRNAME} --lcov > ${COVERAGE_DIRNAME}/out.lcov`,
  `genhtml --ignore-errors inconsistent --ignore-errors range -o ${COVERAGE_DIRNAME}/html ${COVERAGE_DIRNAME}/out.lcov`,
  `pnpm dlx httpster -d ${COVERAGE_DIRNAME}/html/`,
].join(" && ");

const testIntegration: Task = {
  async fn({ sh, logger }) {
    if (Deno.env.get("RAD_SKIP_INTEGRATION_TESTS")) return;
    logger.info(`:: cli integration tests in docker`);
    await sh(
      `docker run --name rad-integration --rm -v $PWD:$PWD --entrypoint $PWD/test/integration/rad.cli.init.sh --workdir $PWD denoland/deno:alpine-${DENO_VERSION}`,
    );
  },
};

const test: Task = {
  dependsOn: [testUnit, testIntegration],
  dependsOnSerial: true,
};
const lint: Task = `deno lint .rad examples src test`;
const check: Task = { dependsOn: [format, lint, test], dependsOnSerial: true };

const syncNextMain: Task =
  `git fetch origin main && git rebase origin/main && git checkout main && git merge next && git push origin main && git checkout next && git merge main`;

export const tasks: Tasks = {
  ...{ c: check, check },
  ...{ coverage, cov: coverage },
  ...{ f: format, format },
  ...{ l: lint, lint },
  ...{ s: buildSite, site: buildSite, serveSite, serve: serveSite },
  ...{ snm: syncNextMain, syncNextMain },
  ...{ t: test, test },
  ...{ testUnit, tu: testUnit, testIntegration, ti: testIntegration },
  patchInstallVersion,
};

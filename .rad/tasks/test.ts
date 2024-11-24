import { Task } from "./common.ts";

const COVERAGE_DIRNAME = ".coverage";
const DENO_VERSION = Deno.version.deno;

export const testUnit: Task = {
  async fn({ sh, logger }) {
    logger.info(`:: unit tests`);
    await sh([
      `rm -rf ${COVERAGE_DIRNAME}`,
      `deno test -A --coverage=${COVERAGE_DIRNAME}`,
    ].join(" && "));
  },
  name: "testUnit",
};

export const testIntegration: Task = {
  async fn({ sh, logger }) {
    if (Deno.env.get("RAD_SKIP_INTEGRATION_TESTS")) return;
    logger.info(`:: cli integration tests in docker`);
    await sh(
      `docker run --name rad-integration --rm -v $PWD:$PWD --entrypoint $PWD/test/integration/rad.cli.init.sh --workdir $PWD denoland/deno:alpine-${DENO_VERSION}`,
    );
  },
  name: "testIntegration",
};

export const test: Task = {
  dependsOn: [testUnit, testIntegration],
  dependsOnSerial: true,
  name: "test",
};

export const coverage: Task = {
  dependsOn: [testUnit],
  async fn({ sh, logger }) {
    const cmds = [
      `deno coverage --include="${Deno.cwd()}" ${COVERAGE_DIRNAME} --lcov > ${COVERAGE_DIRNAME}/out.lcov`,
      `genhtml --ignore-errors inconsistent --ignore-errors range -o ${COVERAGE_DIRNAME}/html ${COVERAGE_DIRNAME}/out.lcov`,
    ];
    for (const cmd of cmds) {
      logger.info(`:: ${cmd}`);
      await sh(cmd);
    }
  },
  name: "coverage",
};

export const coverageShow: Task = {
  dependsOn: [coverage],
  fn: ({ sh }) => sh(`open ${COVERAGE_DIRNAME}/html/index.html`),
  name: "coverageShow",
};

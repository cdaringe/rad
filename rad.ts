import type { Task, Tasks } from "./src/mod.ts";
import { task as site } from "./.rad/tasks/site.ts";
import { task as patchInstallVersion } from "./.rad/tasks/patch-install-version.ts";

const DENO_VERSION = Deno.version.deno;

const format: Task = { fn: ({ sh }) => sh(`deno fmt`) };
const test: Task = {
  async fn({ sh, logger }) {
    logger.info(`:: unit tests`);
    await sh(`deno test --unstable -A --coverage=.coverage`);
    if (Deno.env.get("RAD_SKIP_INTEGRATION_TESTS")) return;
    logger.info(`:: cli integration tests in docker`);
    await sh(
      `docker run --name rad-integration --rm -v $PWD:/radness --entrypoint /radness/test/integration/rad.cli.init.sh --workdir /radness hayd/deno:alpine-${DENO_VERSION}`,
    );
  },
};
const lint: Task = `deno --unstable lint .rad examples src test`;
const check: Task = { dependsOn: [format, lint, test] };

export const tasks: Tasks = {
  ...{ l: lint, lint },
  ...{ f: format, format },
  ...{ t: test, test },
  ...{ s: site, site },
  ...{ c: check, check },
  patchInstallVersion,
};

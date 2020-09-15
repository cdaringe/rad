import type { Task, Tasks } from "./src/mod.ts";
import { task as site } from "./.rad/tasks/site.ts";
import { task as patchInstallVersion } from "./.rad/tasks/patch-install-version.ts";

const DENO_VERSION = "1.4.0";

const format: Task = { fn: ({ sh }) => sh(`deno fmt`) };
const test: Task = {
  async fn({ sh, logger }) {
    logger.info(`:: unit tests`);
    await sh(`deno test --unstable -A --coverage`);
    logger.info(`:: cli integration tests`);
    await sh(
      `docker run --name rad-integration --rm -v $PWD:/radness --entrypoint /radness/test/integration/rad.cli.init.sh --workdir /radness hayd/deno:alpine-${DENO_VERSION}`,
    );
  },
};
const check: Task = { dependsOn: [format, test] };

export const tasks: Tasks = {
  ...{ f: format, format },
  ...{ t: test, test },
  ...{ s: site, site },
  ...{ c: check, check },
  patchInstallVersion,
};

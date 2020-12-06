import fixtures from "./fixtures/mod.ts";
import { sh } from "../src/util/sh.ts";
import { createLogger } from "../src/logger.ts";
Deno.test({
  name: fixtures.asTestName("sh options", import.meta),
  fn: async () => {
    await sh(`ls > /dev/null`, {
      logger: await createLogger("CRITICAL"),
    });
  },
});

import * as rad from "../src/mod.ts";
import fixtures from "./fixtures/mod.ts";
import { asserts } from "../src/3p/std.test.ts";
import { path } from "../src/3p/std.ts";
const { assert } = asserts;

Deno.test({
  name: fixtures.asTestName("fixtures", import.meta),
  fn: async () => {
    var { dirname } = await fixtures.createTestFolderContext();
    await fixtures.copyContents(fixtures.basicDirname, dirname);
    var radness = await rad.init(
      {
        radFilename: path.join(dirname, "rad.ts"),
        logger: await fixtures.getTestLogger(),
      },
    );
    assert(radness.tasks, "tasks found in radfile");
  },
});

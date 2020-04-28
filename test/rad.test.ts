import * as rad from "../src/mod.ts";
import fixtures from "./fixtures/mod.ts";
import { testing } from "../src/3p/std.test.ts";
import { path } from "../src/3p/std.ts";
const { assert } = testing;

Deno.test({
  name: "fixtures",
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

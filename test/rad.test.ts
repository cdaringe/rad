import * as rad from "../src/mod.ts";
import * as path from "https://deno.land/std/node/path.ts";
import fixtures from "./fixtures/mod.ts";

import { assert } from "https://deno.land/std/testing/asserts.ts";

Deno.test({
  name: "fixtures",
  fn: async () => {
    var { dirname } = await fixtures.createTestFolderContext();
    await fixtures.copyContents(fixtures.basicDirname, dirname);
    var radness = await rad.init({ radFilename: path.join(dirname, "rad.ts") });
    assert(radness.tasks, "tasks found in radfile");
  },
});

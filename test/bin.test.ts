import { testing } from "../src/3p/std.test.ts";

import { assertFlags, suchRad } from "../src/bin.ts";
import { RadError } from "../src/errors.ts";
import fixtures from "./fixtures/mod.ts";
const { assertThrows, assertEquals, assertThrowsAsync } = testing;
Deno.test({
  name: "cli flags accept/reject",
  fn: () => {
    assertThrows(() => assertFlags({ batman: true }));
    assertEquals(
      assertFlags(
        {
          h: true,
          help: true,
          r: true,
          radfile: true,
          "log-level": true,
          l: true,
        },
      ),
      undefined,
    );
  },
});

Deno.test({
  name: "bin entry",
  fn: async function testEntry() {
    var { dirname, radFilename } = await fixtures.createTestFolderContext();
    await fixtures.copyContents(fixtures.basicDirname, dirname);
    await assertThrowsAsync(async () => {
      await suchRad({ _: [], r: radFilename });
    }, RadError, "task name provided");
    await assertThrowsAsync(async () => {
      await suchRad({ _: ["missing-task"], r: radFilename });
    }, RadError, "no task");
    await assertThrowsAsync(async () => {
      await suchRad({ _: ["docs"], r: radFilename, potoates: {} });
    }, RadError, "expected string");
    await assertThrowsAsync(async () => {
      await suchRad({ _: ["docs"], r: radFilename, potoates: "veggie" });
    }, RadError, "invalid CLI");
    const res = await suchRad({ _: ["docs"], r: radFilename });
    assertEquals(res!.taskName, "docs");
  },
});

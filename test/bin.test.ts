import {
  assertThrows,
  assertEquals,
} from "https://deno.land/std/testing/asserts.ts";
import { assertFlags } from "../src/bin.ts";

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

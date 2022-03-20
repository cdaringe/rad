import * as rad from "../src/mod.ts";
import fixtures from "./fixtures/mod.ts";
import { assert } from "../src/3p/std.test.ts";
import { path } from "../src/3p/std.ts";

Deno.test({
  name: fixtures.asTestName("fixtures", import.meta),
  fn: async () => {
    const { dirname } = await fixtures.createTestFolderContext();
    await fixtures.copyContents(fixtures.basicDirname, dirname);
    const radness = await rad.init(
      {
        radFilename: path.join(dirname, "rad.ts"),
        logger: await fixtures.getTestLogger(),
      },
    );
    assert(radness.tasks, "tasks found in radfile");
  },
});

const defaultUrl = "https://deno.land/x/rad/src/mod.ts";

Deno.test({
  name: fixtures.asTestName("getCustomImportUrl", import.meta),
  fn: () => {
    const noCustomUrl = rad.getCustomImportUrl({
      defaultUrl,
      srcUrl: "https://some.place.rad/src/mod.ts",
    });
    assert(
      noCustomUrl === null,
      "no custom url returned when no version in srcUrl",
    );
    const customUrlWithVersion = rad.getCustomImportUrl({
      defaultUrl,
      srcUrl: "https://deno.land/x/rad@v4.0.3/src/mod.ts",
    });
    assert(
      customUrlWithVersion === "https://deno.land/x/rad@v4.0.3/src/mod.ts",
      "url returned when version in srcUrl",
    );
  },
});

import { build } from "../../../src/build-buds/deb/mod.ts";
import { path } from "../../../src/3p/std.ts";
import { assert, assertEquals } from "../../../src/3p/std.test.ts";
import { globSimple } from "../../../src/util/glob.ts";

const { dirname, join, fromFileUrl } = path;

const fixturesDirname = join(
  dirname(fromFileUrl(import.meta.url)),
  "fixtures",
);

const fixturesJsGlob = join(fixturesDirname, "**/*.js");
const fixturesMapGlob = join(fixturesDirname, "**/*.map");
const fooFilename = join(fixturesDirname, "foo/mod.ts");

const clean = async () => {
  const matches = [
    ...(await globSimple(fixturesJsGlob)),
    ...(await globSimple(fixturesMapGlob)),
  ];
  await Promise.all(matches.map(({ path }) => Deno.remove(path)));
};

Deno.test({
  name: "deb (deno esm browser) - build",
  fn: async () => {
    await clean();
    const compilations = await build({
      moduleFilenames: [fooFilename],
    });
    assertEquals(compilations.length, 1, "one compilation emitted");
    const out = compilations[0];
    assert(out);
    const filenames = Object.keys(out.files);
    const expectedJs = ["foo/mod.ts.js", "bar/mod.ts.js"];
    expectedJs.forEach((filename) => {
      assert(filenames.some((f) => f.endsWith(filename)));
      assert(filenames.some((f) => f.endsWith(filename + ".map")));
    });
    await clean();
  },
});

Deno.test({
  name: "deb (deno esm browser) - build with outDir",
  fn: async () => {
    const outDir = ".tmp_deb_out";
    const cleanOut = () =>
      Deno.remove(outDir, { recursive: true }).catch(() => null);
    await cleanOut();
    try {
      const compilations = await build({
        moduleFilenames: [fooFilename],
        outDir,
      });
      const out = compilations[0]!;
      const filenames = Object.keys(out.files).sort();
      const expectedFilenames = [
        "file://.tmp_deb_out/test/build-buds/deb/fixtures/foo/mod.ts.js.map",
        "file://.tmp_deb_out/test/build-buds/deb/fixtures/bar/mod.ts.js.map",
        "file://.tmp_deb_out/test/build-buds/deb/fixtures/foo/mod.ts.js",
        "file://.tmp_deb_out/test/build-buds/deb/fixtures/bar/mod.ts.js",
      ].sort();
      assertEquals(
        filenames,
        expectedFilenames,
        `compiled filenames updated w/ outDir paths`,
      );
    } finally {
      await cleanOut();
    }
  },
});

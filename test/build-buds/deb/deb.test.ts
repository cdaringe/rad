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
  await Promise.all(matches.map(({ path }) => {
    // console.warn(`removing: ${path}`);
    return Deno.remove(path);
  }));
};

const beforeAfter = (
  fn: (t: Deno.TestContext) => Promise<unknown>,
  opts: { before?: () => Promise<unknown>; after?: () => Promise<unknown> },
) =>
async (t: Deno.TestContext) => {
  opts?.before && await opts.before();
  try {
    await fn(t);
  } finally {
    opts?.after && await opts.after();
  }
};

Deno.test({
  name: "deb (deno esm browser) - build",
  fn: beforeAfter(async () => {
    const compilations = await build({
      moduleFilenames: [fooFilename],
      emitOptions: {},
    });
    assertEquals(compilations.length, 1, "one compilation emitted");
    const out = compilations[0];
    assert(out);
    const filenames = Object.keys(out);
    const expectedJs = ["foo/mod.js", "bar/mod.js"];
    expectedJs.forEach((filename) => {
      assert(filenames.some((f) => f.endsWith(filename)));
    });
  }, { before: clean, after: clean }),
});

const outDir = ".tmp_deb_out";
const cleanOut = () =>
  Deno.remove(outDir, { recursive: true }).catch(() => null);

Deno.test({
  name: "deb (deno esm browser) - build with outDir",
  fn: beforeAfter(async () => {
    const compilations = await build({
      moduleFilenames: [fooFilename],
      outDir,
    });
    const out = compilations[0]!;
    const filenames = Object.keys(out).sort();
    const expectedFilenames = [
      ".tmp_deb_out/test/build-buds/deb/fixtures/foo/mod.js",
      ".tmp_deb_out/test/build-buds/deb/fixtures/bar/mod.js",
    ].sort();
    assertEquals(
      filenames,
      expectedFilenames,
      `compiled filenames updated w/ outDir paths`,
    );
  }, { before: cleanOut, after: cleanOut }),
});

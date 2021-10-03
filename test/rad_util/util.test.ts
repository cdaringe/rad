import { createFsUtil } from "../../src/util/fs.ts";
import fixtures from "../fixtures/mod.ts";
import { assert } from "../../src/3p/std.test.ts";

type Case = {
  name: string;
  fn: (fs: ReturnType<typeof createFsUtil>) => Promise<boolean>;
};

const cases: Case[] = [
  {
    name: ".exists true on file present",
    fn: (fs) => fs.exists(fs.df(import.meta.url)),
  },
  {
    name: ".exists false on file missing",
    fn: (fs) =>
      fs.exists("non-existant-file").then((isExisting) => !isExisting),
  },
  {
    name: "mkdirp does the good stuff",
    fn: (fs) =>
      Deno.makeTempDir().then(async (dir) => {
        const testTempDir = `${dir}/test_temp_dir`;
        await fs.mkdirp(testTempDir);

        return Deno.stat(testTempDir).then((stat) => stat.isDirectory);
      }),
  },
  {
    name: "readFile does the good stuff",
    fn: (fs) =>
      fs.readFile(fs.df(import.meta.url)).then((f) =>
        !!f.match(/readFile does the good stuff/)
      ),
  },
  {
    name: "writeFile does the good stuff",
    fn: async (fs) => {
      const dir = await Deno.makeTempDir();
      const f = `${dir}/z`;
      await fs.writeFile(f, "test");
      return fs.readFile(f).then((text) => {
        return !!text.match(/test/);
      });
    },
  },
];

cases.forEach(({ fn, name }) => {
  Deno.test({
    name,
    fn: async () => {
      const fs = createFsUtil({ logger: await fixtures.getTestLogger() });
      assert(await fn(fs) === true);
    },
  });
});

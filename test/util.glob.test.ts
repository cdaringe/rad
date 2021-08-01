import { assertEquals } from "../src/3p/std.test.ts";
import { createPathMatcher } from "../src/util/glob.ts";
import { path } from "../src/3p/std.ts";
import fixtures from "./fixtures/mod.ts";

Deno.test({
  name: fixtures.asTestName("fs walk glob matcher", import.meta),
  fn: () => {
    const dotRootSingleFile = createPathMatcher({
      root: ".",
      pattern: "file1",
    });
    const dotRootSingleFileDotPrefixed = createPathMatcher({
      root: ".",
      pattern: "./file1",
    });
    const dotRootAllFilesInRoot = createPathMatcher({
      root: ".",
      pattern: "./*",
    });
    [
      [`dotRootSingleFile`, dotRootSingleFile, "file1", true],
      [`dotRootSingleFile`, dotRootSingleFile, "./file1", true],
      [`dotRootSingleFile`, dotRootSingleFile, "./folder/fake", false],
      [
        `dotRootSingleFileDotPrefixed`,
        dotRootSingleFileDotPrefixed,
        "./file1",
        true,
      ],
      [
        `dotRootSingleFileDotPrefixed`,
        dotRootSingleFileDotPrefixed,
        "file1",
        true,
      ],
      [`dotRootAllFilesInRoot`, dotRootAllFilesInRoot, "file1", true],
      [`dotRootAllFilesInRoot`, dotRootAllFilesInRoot, "file2", true],
      [`dotRootAllFilesInRoot`, dotRootAllFilesInRoot, "folder/fake", false],
    ].map(([name, matcher_, input_, expected], i) => {
      const matcher = (matcher_ as unknown) as RegExp;
      const input = path.isAbsolute(input_ as string)
        ? input_ as string
        : path.resolve(Deno.cwd(), input_ as string);
      assertEquals(
        matcher.test(input),
        expected,
        `[${i}] ${name}:: input: ${input} matcher: ${String(matcher)}`,
      );
    });
    // const desepRoot = createPathMatcher({
    //   root: '/a/b/c/',
    //   pattern:
    // })
    // assert()
  },
});

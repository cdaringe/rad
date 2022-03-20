import { fs, path } from "../3p/std.ts";
import type { WithLogger } from "../logger.ts";
import { toArray } from "./iterable.ts";

type CreatePathMatcherOpts = { root: string; pattern: string };
export const createPathMatcher = ({
  root,
  pattern,
}: CreatePathMatcherOpts) => {
  const isAbsolute = pattern.startsWith(path.sep);
  const matcher = path.globToRegExp(
    isAbsolute ? pattern : path.resolve(root, pattern),
    {
      extended: true,
      globstar: true,
    },
  );
  return matcher;
};

export const glob = (opts: CreatePathMatcherOpts & Partial<WithLogger>) => {
  const { root: userRoot, logger } = opts;
  const root = userRoot === "." ? Deno.cwd() : userRoot;
  const matcher = createPathMatcher({ root, pattern: opts.pattern });
  logger?.debug(
    `creating walk matcher - root: ${root}, matcher: ${String(matcher)}`,
  );
  return fs.walk(root, {
    match: [matcher],
  });
};

export const globSimple = (pattern: string) => {
  const cwd = Deno.cwd();
  const isValid = pattern.includes(cwd);
  if (!isValid) {
    throw new Error(
      `globSimple requires that the pattern be executed from withing the CWD, ${cwd}`,
    );
  }
  return toArray(glob({
    pattern: pattern.replace(cwd, "").replace(/^\//, ""),
    root: ".",
  }));
};

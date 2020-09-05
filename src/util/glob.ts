import { path, fs } from "../3p/std.ts";
import { WithLogger } from "../logger.ts";

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

export const glob = (opts: CreatePathMatcherOpts & WithLogger) => {
  const { root: userRoot, logger } = opts;
  const root = userRoot === "." ? Deno.cwd() : userRoot;
  const matcher = createPathMatcher({ root, pattern: opts.pattern });
  logger.debug(
    `creating walk matcher - root: ${root}, matcher: ${String(matcher)}`,
  );
  return fs.walk(root, {
    match: [matcher],
  });
};

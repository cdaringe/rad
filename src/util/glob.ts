import { path, fs } from "../3p/std.ts";
export const glob = (root: string, pattern: string) => {
  const isAbsolute = pattern.startsWith(path.sep);
  const matcher = path.globToRegExp(
    isAbsolute ? pattern : path.resolve(root, pattern),
    {
      flags: "g",
      extended: true,
      globstar: true,
    },
  );
  return fs.walk(root, {
    match: [matcher],
  });
};

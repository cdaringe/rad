import { path, fs } from '../3p/std.ts'

export const glob = (root: string, pattern: string) =>
  fs.walk(root, {
    match: [path.globToRegExp(pattern, {
      flags: "g",
      extended: true,
      globstar: true,
    })],
  });

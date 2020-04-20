import * as path from "https://deno.land/std/path/mod.ts";
import {
  walk,
} from "https://deno.land/std/fs/mod.ts";

export const glob = (root: string, pattern: string) =>
  walk(root, {
    match: [path.globToRegExp(pattern, {
      flags: "g",
      extended: true,
      globstar: true
    })],
  });

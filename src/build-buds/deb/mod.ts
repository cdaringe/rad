// deb - deno-esm-browser
import type { BuildOptions, ReWriteImports } from "./interfaces.ts";
import { path } from "../../3p/std.ts";
import { emit, importmap } from "./3p.ts";

export const build = (options: BuildOptions) =>
  Promise.all(
    options.moduleFilenames.map((filename) => buildSingle(filename, options)),
  ).then((res) => res.flat());

export async function buildSingle(filename: string, options: BuildOptions) {
  const out = await emit.emit(filename, options.emitOptions);
  await Promise.all(
    Object.entries(out).map(async ([f, code]) => {
      const filenameJs = f.replace("file://", "").replace(/ts$/, "js");
      await Deno.writeTextFile(
        filenameJs,
        await (options.rewriteImports
          ? options.rewriteImports(code, f)
          : rewriteImports(options)(code, f)),
      );

      // update out
      const temp = out[f];
      delete out[f];
      out[filenameJs] = temp;

      const outDir = options.outDir;
      if (outDir) {
        if (outDir.startsWith(path.SEP)) {
          throw new Error(`outDir must be relative to CWD`);
        }
        const relativeFilename = path.relative(Deno.cwd(), filenameJs);
        const outFilename = path.join(outDir, relativeFilename);
        await Deno.mkdir(path.dirname(outFilename), { recursive: true });
        await Deno.rename(filenameJs, outFilename);

        // update out
        const temp = out[filenameJs];
        delete out[filenameJs];
        out[outFilename] = temp;
      }
    }),
  );
  return out;
}

/**
 * Rewrite imports according to a provided importMap.
 * This is an inelegant solution, & is better fitted for an AST transform.
 * However, emit (rather, the typescript compiler), does not allow
 * for user transforms on compile. Thus, rather than build re-parse the
 * emitted JS into babel or acorn, do a simple find/replace.
 *
 * Rewrite `import ... from "foo/bar.ts"` to `import ... from "https://hostname/esm/foo/bar.ts"
 * given options.rewriteImportMap of:
 *
 * {
 *   "imports": {
 *     "foo/": "https://hostname/esm/foo/"
 *   }
 * }
 */
const rewriteImports: (options: BuildOptions) => ReWriteImports =
  (options) => async (code, _f) => {
    const importMap = options.rewriteImportMap
      ? (options.rewriteImportMap?.imports || {} as importmap.SpecifierMap)
      : (options.rewriteImportMapPath || {} as importmap.SpecifierMap);
    if (!importMap) {
      throw new Error("missing import map")
        ? await Deno.readTextFile(options.rewriteImportMapPath!).then((v) =>
          (JSON.parse(v) as importmap.ImportMap).imports
        )
        : {};
    }
    return Object.entries(importMap)
      .reduce(
        (transformed, [oldBase, newBase]) =>
          transformed.replaceAll(
            new RegExp(`(import[^('|")]*)('|")([^('|")\n]+)('|")`, "g"),
            (_, importFrom, quote1, modPath, quote2) =>
              `${importFrom}${quote1}${
                modPath.replace(
                  oldBase,
                  newBase,
                )
              }.js${quote2}`,
          ),
        code,
      );
  };

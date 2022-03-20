export type BuildOptions = {
  /** modules (and their associated graph) to compile */
  moduleFilenames: string[];
  /** rewrite all matching imports to use the specified base(s) */
  rewriteImportMap?: Deno.ImportMap;
  /** rewrite all matching imports to use the specified base(s) */
  rewriteImportMapPath?: string;
  /**
   * move compiled artifacts into outDir. outDir **must** be a relative
   * path to Deno.cwd()
   */
  outDir?: string;

  /** custom, optional function to perform re-writes, as desired */
  rewriteImports?: ReWriteImports;
  /** customizations passed directly into `Deno.emit` */
  emitOptions?: Deno.EmitOptions;
};

export type ReWriteImports = (
  code: string,
  filename: string,
) => string | Promise<string>;

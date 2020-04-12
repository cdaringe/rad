export async function readFile(filename: string, type?: string) {
  return new TextDecoder(type || "utf-8").decode(
    await Deno.readFile(filename),
  );
}

export async function writeFile(filename: string, data: any) {
  const encoder = new TextEncoder();
  return Deno.writeFileSync(filename, encoder.encode(data));
}

export async function mkdirp(filename: string, opts?: any) {
  const recursiveOpts = opts || {};
  recursiveOpts.recursive = true;
  return Deno.mkdir(filename, recursiveOpts);
}

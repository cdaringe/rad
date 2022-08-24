export type SetupNode = { version: number };
export const make = (opts: SetupNode) => (
  {
    name: "setup-node",
    uses: "actions/setup-node@v3",
    with: { "node-version": opts.version },
  }
);

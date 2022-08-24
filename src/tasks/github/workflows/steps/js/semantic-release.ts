export type SemRel = { dryRun?: boolean; packageManager?: string };

/**
 * Runs semantic-release in normal mode or in dry run
 */
export const make = ({ dryRun = false, packageManager = "npm" }: SemRel) => ({
  name: "semantic-release",
  env: {
    GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
    NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
  },
  run: `
${packageManager} init -y \
&& ${packageManager} install -D \
  "semantic-release" \
  "@semantic-release/commit-analyzer" \
  "@semantic-release/release-notes-generator" \
  "@semantic-release/github" \
  "@semantic-release/git" \
  "@semantic-release/exec" \
&& ./node_modules/.bin/semantic-release ${dryRun ? "--dry-run" : ""}
`.trim(),
});

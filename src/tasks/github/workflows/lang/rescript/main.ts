import { make as semrel } from "../../steps/js/semantic-release.ts";
export const make = (
  opts: {
    workflow?: {
      name?: string;
      runsOn?: string;
    };
    setupNode: { version: number };
    semanticRelease?: Partial<Parameters<typeof semrel>>;
  },
) => ({
  name: "main",
  on: { push: { branches: ["main"] } },
  env: { FOO: "BAR" },
  jobs: {
    checks: {
      uses: "./.github/workflows/onchange.yml",
    },
    main: {
      name: opts.workflow?.name?.trim() || "main",
      "runs-on": opts.workflow?.name?.trim() || "ubuntu-latest",
      needs: ["checks"],
      steps: [
        semrel({}),
      ],
    },
  },
});

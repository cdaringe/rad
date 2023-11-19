import { make as semrel } from "../../steps/js/semantic-release.ts";
import { make as setupNode, SetupNode } from "../../steps/js/setup-node.ts";
export const make = (
  opts: {
    workflow?: {
      name?: string;
      runsOn?: string;
    };
    setupNode: SetupNode;
    semanticRelease?: Partial<Parameters<typeof semrel>>;
  },
) => ({
  name: "onchange",
  on: ["workflow_call", "pull_request"],
  env: { FOO: "BAR" },
  jobs: {
    check: {
      name: opts.workflow?.name?.trim() || "onchange",
      "runs-on": opts.workflow?.name?.trim() || "ubuntu-latest",
      steps: [
        { uses: "actions/checkout@v3" },
        setupNode(opts.setupNode),
        semrel({ dryRun: true, ...opts.semanticRelease }),
      ],
    },
  },
});

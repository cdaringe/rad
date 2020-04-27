import { Tasks } from "https://raw.githubusercontent.com/cdaringe/rad/master/src/mod.ts";

export const tasks: Tasks = {
  makeDemo: {
    target: "t1",
    prereqs: ["p1", "p2"],
    async onMake({ logger }, { prereqs, getChangedPrereqFilenames }) {
      for await (const req of prereqs) {
        logger.info(`req: ${req.filename} ${JSON.stringify(req.info)}`);
      }
      const changed = await getChangedPrereqFilenames();
      logger.info(`changed: ${changed} (${changed.length})`);
    },
  },
};

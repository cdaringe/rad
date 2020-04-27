import { Tasks } from "https://raw.githubusercontent.com/cdaringe/rad/master/src/mod.ts";

export const tasks: Tasks = {
  docs: {
    fn: async function makeDocs({ logger, path, fs }) {
      // const __dirname = import.meta.url.replace('file://', '')
      // const input = path.join(__dirname, "./doc.md");
      // const output = path.join(__dirname, "./build/dummy.md");
      // logger.info(`reading ${input}`)
      // var content = (await fs.readFile(input)).toString();
      // content += `\nCreated on ${new Date().toISOString()}`;
      // logger.info(`writing ${output}`)
      // await fs.mkdirp(path.dirname(output));
      // await fs.writeFile(output, content);
    },
  },
};

// import { UserTasks } from "../../../src/Task.ts"
// export const tasks: UserTasks = {
export const tasks: any = {
  docs: {
    fn: async function makeDocs(opts: any) {
      const input = "./doc.md";
      const output = "./build/dummy.md";
      var { Deno, fs, path } = opts;
      var content = (await Deno.readFile("./doc.md")).toString();
      content += `\nCreated on ${new Date().toISOString()}`;
      await fs.mkdirp(path.dirname(output));
      await fs.writeFile(output, content);
    },
  },
  // bundle: {
  //   input: './build/dummy.md',
  //   output: './build/bundle.zip',
  //   dependsOn: ['docs'],
  //   cmd: opts => `zip build/${opts.task.output} build/${opts.dependsOn.docs.output}`
  // }
  // }
};

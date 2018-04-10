module.exports = {
  tasks: {
    docs: {
      input: './doc.md',
      output: './build/dummy.md',
      fn: async function makeDocs (opts) {
        var { fs, path, task: { output } } = opts
        var content = (await fs.readFile('./doc.md')).toString()
        content += `\nCreated on ${new Date().toISOString()}`
        await fs.mkdirp(path.dirname(output))
        await fs.writeFile(output, content)
      }
    },
    bundle: {
      input: './build/dummy.md',
      output: './build/bundle.zip',
      dependsOn: ['docs'],
      cmd: opts => `zip build/${opts.task.output} build/${opts.dependsOn.docs.output}`
    }
  }
}

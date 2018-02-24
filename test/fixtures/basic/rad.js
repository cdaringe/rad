module.exports = {
  tasks: {
    docs: {
      type: 'make',
      target: './build/dummy.md',
      fn: async function makeDocs (opts) {
        var { fs, path, task: { target } } = opts
        var content = (await fs.readFile('./doc.md')).toString()
        content += `\nCreated on ${new Date().toISOString()}`
        await fs.mkdirp(path.dirname(target))
        await fs.writeFile(target, content)
      }
    },
    bundle: {
      type: 'make',
      target: './build/bundle.zip',
      dependsOn: ['docs'],
      cmd: opts => `zip build/${opts.task.target} build/${opts.dependsOn.docs.target}`
    }
  }
}

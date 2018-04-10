var path = require('path')
var outputBundle = path.join(__dirname, './build/bundle.zip')
var outputDocs = path.join(__dirname, './build/dummy.md')

module.exports = {
  tasks: {
    docs: {
      input: path.join(__dirname, './doc.md'),
      output: outputDocs,
      fn: async function makeDocs (opts) {
        var { fs, path, task: { input, output } } = opts
        var buffer = await fs.readFile(input)
        var content = buffer.toString()
        content = content.replace(/({[^}]*})/, 'test_world')
        await fs.mkdirp(path.dirname(output))
        await fs.writeFile(output, content)
      }
    },
    bundle: {
      input: [outputDocs],
      output: outputBundle,
      dependsOn: ['docs'],
      cmd: opts => `zip ${opts.task.output} ${outputDocs}`
    }
  }
}

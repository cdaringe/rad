var path = require('path')
var targetBundle = path.join(__dirname, './build/bundle.zip')
var targetDocs = path.join(__dirname, './build/dummy.md')

module.exports = {
  tasks: {
    docs: {
      target: targetDocs,
      fn: async function makeDocs (opts) {
        var { fs, path, task: { target } } = opts
        var docFilename = path.join(__dirname, './doc.md')
        var buffer = await fs.readFile(docFilename)
        var content = buffer.toString()
        content = content.replace(/({[^}]*})/, 'test_world')
        await fs.mkdirp(path.dirname(target))
        await fs.writeFile(target, content)
      }
    },
    bundle: {
      target: targetBundle,
      dependsOn: ['docs'],
      cmd: opts => {
        return `zip ${opts.task.target} ${targetDocs}`
      }
    }
  }
}

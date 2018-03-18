module.exports = {
  tasks: {
    docs: {
      target: 'node_modules',
      fn: async function installNodeModules (opts) {
        var { execa } = opts
        await execa('yarn')
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

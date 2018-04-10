module.exports = {
  tasks: {
    yarn: {
      target: 'package.json',
      cmd: 'yarn'
    },
    build: {
      target: 'bundle.zip',
      dependsOn: ['yarn'],
      cmd: opts => `
        zip ${opts.task.target} \\
          src \\
          node_modules \\
          ${opts.upstream.yarn.task.target} # i.e package json
      `
    }
  }
}

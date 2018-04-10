module.exports = {
  tasks: {
    yarn: {
      input: 'package.json',
      cmd: 'yarn'
    },
    build: {
      output: 'bundle.zip',
      dependsOn: ['yarn'],
      cmd: opts => `
        zip ${opts.task.output} \\
          src \\
          node_modules \\
          ${opts.upstream.yarn.task.input}
      `
    }
  }
}

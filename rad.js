var { dirname } = require('path')
module.exports = {
  tasks: {
    yarn: {
      input: 'package.json',
      output: 'node_modules',
      cmd: 'yarn'
    },
    build: {
      input: 'node_modules',
      output: 'build/rad',
      dependsOn: ['yarn'],
      cmd: opts => `
        mkdir -p ${dirname(opts.task.output)} && \\
        nexe --verbose -o ${opts.task.output}
      `
    }
  }
}

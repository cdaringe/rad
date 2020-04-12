export const tasks = {
  yarn: {
    input: 'package.json',
    output: 'node_modules',
    cmd: 'yarn'
  },
  build: {
    input: 'node_modules',
    output: 'bundle.zip',
    dependsOn: ['yarn'],
    cmd: opts => `
      zip ${opts.task.output} \\
        src \\
        ${opts.upstream.yarn.task.output}
    `
  }
}

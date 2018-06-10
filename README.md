# rad :100:

the best general purpose build tool that money won't buy.

**WARNING**: ALPHA SOFTWARE, ACTIVE IN DEVELOPMENT.  THIS README IS WRITTEN TO OUR TARGET STATE, NOT OUR CURRENT STATE

## usage

`$ rad`

```js
// rad.js - your buildfile
var { dirname } = require('path')
module.exports = {
  tasks: {
    yarn: {
      input: 'package.json',
      output: 'node_modules',
      cmd: 'yarn'
    },
    build: {
      input: 'src',
      output: 'build/rad',
      dependsOn: ['yarn'],
      cmd: opts => `
        mkdir -p ${dirname(opts.task.output)} && \\
        nexe --verbose -o ${opts.task.output}
      `
    }
  }
}
```

## install

see our `releases` section

## what is it

- bottom-up, `make`-style build targets
  - fast builds, skip redundant tasks when inputs haven't changed!
- pipeline style builds
  - easy to understand, declarative build steps
- standalone executable means build automation for _any_ language or project
- generic package management
- great UX is priority 1

## why

no build tools in 2018 have a complete feature set that the average polyglot programmer needs without coercing it or piling on extraneous complexity.

see [why not just use <my-favorite-build-tool>](./why-not.md)

## features

- stop using `make` and `bash`.  use a modern syntax and a real scripting language
  - `<ref to why bash is not fit for general purpose scripting>`
- no DSL.  your **build is code**--tasks are POJOs with a verified interface
- debuggable. :bug: halt the runtime, inspect your data, tasks, or even _rad_ itself
- beautiful.
- take it anywhere.
  - osx, linux, windows!
    - help us support other architectures
- no dependencies.
  - e.g. you don't need bash, or java, this lib, that lib, etc.  we bundle everything we need.
- adds `node_modules/.bin/` to your PATH, so you can run node bins easily


## the future

currently this tool uses/embeds nodejs for a runtime and js as the scripting language.  this is great!  however, it does make for a fat executable.  long term we want to migrate to smaller binary, convert the engine to Rust (safe, fast, on-the-metal), and embed a smaller scripting language.  ATM, we are looking
at Juila for that replacement.  Julia is "nearly as fast as C", small, and gives developers a proper language to script build tasks with (read: not bash, & embeddable).  Julia debugging support, or any common, embeddable scripting language for that matter, is not nearly as stable & easy as node.  Therefore, we will stick with node until further notice!

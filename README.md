# rad :100:

the best general purpose build tool that money won't buy.

**WARNING**: ALPHA SOFTWARE, ACTIVE IN DEVELOPMENT.  THIS README IS WRITTEN TO OUR TARGET STATE, NOT OUR CURRENT STATE

## usage

`$ rad`

## install

see our `releases` section

## what is it

- bottom-up, make-style build targets
  - fast builds, skip redundant tasks when inputs haven't changed!
- pipeline style builds
  - easy to understand, declarative build steps
- standalone executable means build automation for _any_ language or project
- generic package management
- great UX is priority 1

## why

- stop using make and bash--use a modern syntax and a real scripting language
  - <ref to why bash is awful>
- no custom DSL--uses POJOs with a verified interface
- you can actually DEBUG it!
- beautiful
- take it anywhere
  - osx, linux, windows!
    - help us support other architectures
- no dependents
  - e.g. you don't need bash, or java, etc.  we bundle everything we need

## features

- adds node_modules/.bin/ to your PATH, so you can run node bins easily
- TaskMake
  - input
  - output
    - name of file, folder, or [glob](https://github.com/isaacs/node-glob). for simplicity, everything internally is just a passed to glob

## the future

currently this tool uses/embeds nodejs for a runtime and js as the scripting language.  this is great!  however, it does make for a fat executable.  long term we want to migrate to smaller binary, convert the engine to Rust (safe, fast, on-the-metal), and embed a smaller scripting language.  ATM, we are looking
at Juila for that replacement.  Julia is "nearly as fast as C", small, and gives developers a proper language to script build tasks with (read: not bash, & embeddable).  Julia debugging support, or any common, embeddable scripting language for that matter, is not nearly as stable & easy as node.  Therefore, we will stick with node until further notice!

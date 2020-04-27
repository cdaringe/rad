# rad 💯

a general purpose build tool.

statically typed, programmable, transparent, batteries included. shell, function based, and make-style task support.

## usage

`$ rad <task-name> [--help]`

```ts
// rad.ts - your buildfile
import { Tasks } from "https://raw.githubusercontent.com/cdaringe/rad/master/src/mod.ts";

// command tasks
const format = `prettier --write`
const test = `deno test`

// function tasks
const compile = {
  dependsOn: [format],
  fn({ sh, ...toolkit }) => sh('tsc')
}

// make-style tasks
const transpile = {
  target: "phony",
  prereqs: ["p1", "p2"],
  async onMake({ logger }, { prereqs, getChangedPrereqFilenames }) {
    const babel = await import("https://my.cdn/babel/7.js")
    for await (const req of prereqs) {
      logger.info(`req: ${req.filename} ${JSON.stringify(req.info)}`);
    }
    const changed = await getChangedPrereqFilenames();
    logger.info(`changed: ${changed} (${changed.length})`);
  },
}

export const tasks: Tasks = {
  compile,
  format,
  test
}
```

## install

there are a few formal ways to use `rad`:

| usage | install-method | install-steps |
| -- | -- | -- |
| cli | `deno` | `deno install rad https://github.com/cdaringe/rad/blob/master/src/bin.ts` |
| cli | `docker` | `docker pull cdaringe/rad` <sup>1</sup>|
| cli | `curl+sh` | `curl <todo>.sh | sh` |
| library | `deno` | `import * as rad from https://github.com/cdaringe/rad/blob/master/src/mod.ts` |


<sup>1</sup>For docker users, consider making a nice shell alias

```sh
# shell profile, e.g. .bash_profile
function rad() {
  docker run --rm -v $PWD:/rad cdaringe/rad "$@";
}
```

## what is it

- bottom-up, `make`-style build targets
  - fast builds, skip redundant tasks when inputs haven't changed!
- pipeline style builds
  - easy to understand, declarative build steps
- highly portable. build automation for _any_ language or project, in many environments
- generic package management
- great UX is priority 1 (after priorities 0.33 works, 0.66 correct, & 0.99 fast-enough :))

## why

no build tools in ~2018~ ~2019~ 2020 have a complete feature set that the average polyglot programmer needs without coercing it or piling on extraneous complexity.

see [why not just use <my-favorite-build-tool>](./why-not.md)

## features

- stop using `make` and `bash`.  use a modern syntax and a real scripting language
  - `<ref to why bash is not fit for general purpose scripting>`
- no DSL. your **build is code**--tasks are POJOs with a verified interface
- debuggable. :bug: halt the runtime, inspect your data, tasks, or even _rad_ itself
- beautiful.
- take it anywhere.
  - osx, linux, windows!
    - help us support other architectures
- no dependencies.
  - e.g. you don't need bash, or java, this lib, that lib, etc.  we bundle everything we need,
courtesy of `deno bundle`!

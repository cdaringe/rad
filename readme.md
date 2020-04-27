# rad 💯

a general purpose build tool.

statically typed, batteries included. command tasks, function tasks, and make-style tasks support.

![master](https://github.com/cdaringe/rad/workflows/master/badge.svg)

jump to:

1. [documentation site](https://cdaringe.github.io/rad/)
1. [usage](#usage)
1. [install](#install)
1. [what](#what-is-it)
1. [why](#what-is-it)
1. [why not `<my-favorite-build-tool>`?](#why-not-my-favorite-build-tool)
1. [manual](https://cdaringe.github.io/rad/#manual)

## usage

`$ rad <task-name> [--help]`

```ts
// rad.ts
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
  async onMake({ logger }, { changedPrereqs /*, prereqs */}) {
    for await (const req of changedPrereqs) {
      logger.info(`req: ${req.filename} ${JSON.stringify(req.info)}`);
    }
  },
}

export const tasks: Tasks = {
  compile,
  format,
  test
}
```

## install

there are a few formal ways to use `rad`. regardless of the route you choose,
know that all strategies support using pinned versions, adherent to semver.
see the [releases page](https://github.com/cdaringe/rad/releases).

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

a build tool! it competes with make, npm-scripts, bazel, gradle, ant, gulp, or any of the
other many tools out there!

`rad` offers:

- simple, programmable task interfaces
- easy to understand, declarative build steps
- type-checked tasks
- productive toolkit API for nuanced tasks that benefit from progamming. see [toolkit](#toolkit)<!-- @todo write toolkit docs-->
- bottom-up, `make`-style build targets
  - fast builds, skip redundant work when inputs haven't changed
- cli mode, or library mode
- portable. build automation for _any_ language or project, in many environments (*limited to _Deno_ target architectures, for the time being. long term, we may package this in `Rust`)
- great UX
- no quirky DSLs (`make`, `gradle`, and friends 😢). **your build is code**--tasks are typescript & are indeed type-checked!
- debuggable. 🐛 inspect your data, tasks, or even _rad_ itself
- simplicity of `make`, without the DSL, coupling to `sh`, and C/C++ biases
- use a real scripting language--**not** `bash/sh`! shell languages are great for running other programs, not for plumbing data

## why

🙄, _another build tool?_.

definitely. no other build tools in ~2018~ ~2019~ 2020 have a sufficiently
balanced enough feature set that the average polyglot programmer needs without
 coercing it or piling on extraneous complexity.

see [why not just use <my-favorite-build-tool>](#why-not-my-favorite-build-tool)


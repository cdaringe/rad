## Manual

Your guide to `rad`!

### Understanding rad

- `rad` is written in typescript and runs on [deno](https://deno.land/)
- You write tasks, then ask `rad` to run them
- `rad` reads your radfile (i.e. `rad.ts`), compiles & type checks it, then runs
  it through its task graph executor

🤯

### Getting started

The first step to using rad is installation. Please see the [install](#install)
section for guidance.

The CLI also has a decent help page. Once you have installed rad, try running
`rad --help`, to grow acquainted with some of the options you may expect to use
down the road.

Next up, creating a radfile!

#### Setting up rad.ts

To create a new radfile (`rad.ts`), run the following command:

`$ rad -l info --init`

rad.ts should have _two_ key traits:

- an `import type { Task, Tasks } from 'https://path/to/rad/src/mod.ts`
  statement
- an `export const tasks: Tasks = {...}` statement

Tasks are named in `rad.ts` strictly by their _key_ in the `tasks` object.

```ts
export const tasks: Tasks = {
  meet: /* omitted task */,
  greet: /* omitted task */
}
```

The above file has exactly two tasks--`meet` and `greet`! Simple!

`rad` will look in the working directory for your radfile by default. If you so
choose, you may place `rad.ts` elsewhere, and tell rad where to find it using
the `-r/--radfile` flag. Next up, let's define those tasks.

### Tasks

Tasks can take a couple of different forms. Generally, you can simply refer to
the `Task` type in your radfile and get cracking. Let's write a few tasks of
each type.

#### Command tasks

Command tasks are the simplest tasks. they are shell commands for rad to
execute:

```ts
// rad.ts
import type { Task, Tasks } from "url/to/rad/mod.ts";

const compile: Task = `clang file.c`;
const greet: Task = `echo "hello, world!"`;

export const tasks: Tasks = { compile, greet };
```

Command tasks are the only `'string'`ly defined tasks. The associated command
will get executed by `rad` in a child process, a la
`<your-shell> -c '<your-cmd>'`. For example, `rad greet` would be executed via
`bash -c 'echo "hello, world!"'` under the hood if you are using the `bash`
shell.

> ☝🏼Command tasks should tend to be _fast_. If the executed command is not fast,
> you may consider trying a function or make style task to speed things up, if
> feasible.

#### Function tasks

Function tasks are the most capable of all tasks. All other task types
internally get transformed into a function task. To use function tasks, create a
POJO with a `fn` key and function value. `fn` brings one
argument--[`toolkit`](#toolkit)--that offers a nice suite of batteries for your
convenience. ⚡️

```ts
// rad.ts
import type { Task, Tasks } from "url/to/rad/mod.ts";

const build: Task = {
  fn: async (toolkit) => {
    const { logger, sh } = toolkit;
    await sh(`clang hello.c -o hello`);
    logger.info(`compile ok, asserting executable`);
    await sh(`./hello`); // stdout: Hello, world!
    logger.info("binary ok");
  },
};

export const tasks: Tasks = { build };
```

This is a pretty basic function task. When you get to the [`toolkit`](#toolkit)
section, you will see the other interesting utilities provided to do great
things with! You can of course also simply run rad, and introspect the toolkit
API if you are using a deno plugin in your code editor!

#### Make tasks

Make tasks are in honor of [gnu make](https://www.gnu.org/software/make/). Our
make task is intentionally not feature complete with the proper make task--but
it does have an essential core parity--providing an API to access _only files
that have changed_ since the last task run. More specifically, it offers an API
to access only files that have been modified _since_ the `target` has been last
modified. `target` is make-speak for an output file. Our make tasks also exposes
_all_ files specified by your prerequisites as well. One _essential_ difference
between our make task and proper-make tasks is that your `onMake` function will
_still run_ even if no files have changed since the make `target` has
changed--it is up to you to _do nothing_ in the task handler if no work is
warranted. How do you know if know work is warranted? You can consult the
`changedPrereqs` iterator or the `getChangedPrereqFilenames` function. Both
symbols signal to you changes that have occurred since the `target`'s last
modification.

Let us take inspiration from a make task in our very own source project--the
build for this very website. Here is a simplified version:

```ts
// rad.ts
import type { Task, Tasks } from "url/to/rad/mod.ts";

const site: Task = {
  target: "public/index.html",
  prereqs: ["assets/site/**/*.{md}"], // globs only
  onMake: async (
    /* toolkit api -- see #toolkit */
    { fs, logger },
    /* make task api */
    {
      getPrereqFilenames, // Promise<string>
      /**
       * prereqs, // AsyncIterable<WalkInfo>
       * changedPrereqs, // AsyncIterable<WalkInfo>
       * getChangedPrereqFilenames, // Promise<string>
       */
    },
  ) => {
    await fs.mkdirp("public");
    logger.info("collecting prereq filenames");
    const filenames = await getPrereqFilenames();
    const html = await Promise.all(
      filenames.map((filename) =>
        Deno.readTextFile(filename).then((markdown) => marked(markdown))
      ),
    ).then((htmlSnippets) => htmlSnippets.join("\n"));
    await Deno.writeTextFile("./public/index.html", html);
  },
};
```

If you have **many** prereqs, you should consider using the `AsyncIterator`
implementations referenced above so as to not eat all of your memory 😀.

`gnu make` also has a
[pattern syntax](https://www.gnu.org/software/make/manual/html_node/Pattern-Rules.html)
for when your task maps _N_ prereqs to _M_ targets. This is a pretty handy
feature. If you have `prereqs` and the targets can be considered functions of
the prereq files, make style tasks can _remove the `target` task key, and
instead use `mapPrereqToTarget`_. Here is what that looks like in practice:

```ts
export const tasks: Tasks = {
  clean: `rm -rf 'build'`, // command style task
  build: {
    // make style task
    prereqs: ["src/*"],
    mapPrereqToTarget: ({ cwd, /* string */ prereq, /* string */ reroot }) =>
      reroot("src", "build", "coffee", "js"),
    // maps src/tacos.coffee => build/tacos.js
    async onMake() {
      /* snip snip */
    },
  },
};
```

This is certainly _more verbose_ than `make`'s syntax. However, it has the
benefit of being a clear, debuggable function 🤓! Further, this API does not
force you to have 1:1 mappings between inputs and outputs. If prereqs `a` and
`b` mapped to `foo` and `c` mapped to `bar`--no problem, you can express that
easily in `mapPrereqToTarget`!

Check out the type definitions for more on make tasks!

### Task dependencies

All task types, except command style tasks, accept an optional `dependsOn`
array. `dependsOn` is an array of task references. Task references must be
**actual task references**--string based task lookups are not supported,
intentionally. Stringy lookups are brittle, and would be redundant functionality
in `rad`.

> `dependsOn` tasks can be serialized by setting the sibling field
> `dependsOnSerial: true`

```ts
// rad.ts
import type { Task, Tasks } from "url/to/rad/mod.ts";

const install: Task = {
  target: "node_modules",
  prereqs: ["package.json"],
  onMake: async ({ sh }, { getChangedPrereqFilenames }) => {
    const changed = await getChangedPrereqFilenames();
    if (changed.length) await sh(`npm ci --verbose`);
  },
};
const lint: Task = {
  dependsOn: [install],
  fn: ({ sh }) => sh(`npm run lint`),
};
const test: Task = {
  dependsOn: [install],
  fn: ({ sh }) => sh(`npm test`),
};

const ci: Task = {
  dependsOn: [lint, test],
};

export const tasks: Tasks = {
  ci,
  install,
  lint,
  test,
};
```

Sweet! I bet node.js users wish they could just clone a repo and run `rad test`,
then let the system "know" exactly what is needed to be test-ready! Similiarly,
as shown above, our `ci` task should depend on lint & test tasks, of which both
will await an `install` to complete!

You can see what a task `dependsOn` by using `--print-graph`:

```bash
$ rad ci --print-graph
└─ ci
   ├─ lint
   │  └─ install
   └─ test
      └─ install
```

Dude. Nice! We can have nice things!

### Toolkit

The `toolkit` is the first argument to `function` based tasks!

It has the following type!

```ts
export type Toolkit = {
  Deno: typeof Deno;
  fs: fs.FsUtil;
  sh: typeof sh;
  dependentResults: any[];
  logger: Logger;
  path: typeof path;
  task: RadTask;
  iter: typeof iter;
};
```

Well that's not _super_ helpful! Let us study each these keys, one-by-one:

| key                | value                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Deno`             | see the [deno api docs](https://doc.deno.land/https/github.com/denoland/deno/releases/latest/download/lib.deno.d.ts)                                                                                   |
| `fs`               | a few sugar methods, `{ readFile, writeFile, mkdirp }` that work on strings, vs buffers, and assume utf8 for shorthand                                                                                 |
| `sh`               | execute a shell command. see the command task section above!                                                                                                                                           |
| `dependentResults` | results of `dependsOn` tasks. currently these are untyped. getting type inference here is tricky. PRs welcome!                                                                                         |
| `logger`           | the `rad` logger! a standard `Deno` logger with the commonplace log-level methods (e.g. `.info(...)`, `.debug(...)`, etc). see [the source](https://github.com/cdaringe/rad/blob/v6.9.0/src/logger.ts) |
| `path`             | a direct reference to [deno node path](https://deno.land/std/node/path.ts). this API is likely to change if Deno implements a full, proper path module                                                 |
| `task`             | a reference to the internal `RadTask`                                                                                                                                                                  |
| `iter`             | `AsyncIterable` utility functions                                                                                                                                                                      |

### Debugging

To debug your tasks, you can use `deno`'s built in debugging functionality from
v8.

- get the underlying `deno` command used when running `rad` via
  `cat $(which rad)`

```bash
#!/bin/sh
# generated by deno install
exec deno run --allow-read --allow-write --allow-net --allow-env --allow-run --allow-hrtime --unstable 'https://raw.githubusercontent.com/cdaringe/rad/v6.9.0/src/bin.ts' "$@"
```

- extract the `deno run ...` command, drop the leading `exec` and trailing `$@`,
  or equivalents for your shell
- add a `--inspect` or `--inspect-brk` flag after `run`

Example:

```bash
deno  \
  run --inspect-brk -A --allow-run --allow-hrtime --unstable \
  'https://raw.githubusercontent.com/cdaringe/rad/v6.9.0/src/bin.ts' \
  test
# ^ add any args of interest
```

Finally, ensure you have setup your debugger/IDE of choices to connect. See this
project's `<root>/.vscode/launch.json` to see example settings & the
[deno debugging](https://deno.land/manual/getting_started/debugging_your_code)
documentation for more.

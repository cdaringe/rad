## manual

your guide to `rad`!

### understanding rad

- `rad` is written in typescript and runs on [deno](https://deno.land/)
- you write tasks, then ask `rad` to run them
- `rad` reads your radfile (i.e. `rad.ts`), compiles & type checks it, then runs it through its task graph executor

🤯

### getting started

the first step to using rad is installation.
please see the [install](#install) section for specifics.

the cli also has a decent help page. once you've installed rad, try running
`rad --help`, just to grow acquainted with some of the options you may expect
down the road.

next up, creating a radfile!

#### setting up rad.ts

to create a new radfile (`rad.ts`), run the following command:

`$ rad -l info --init`

rad.ts should have _two_ key traits:

- an `import { Task, Tasks } from 'https://path/to/rad/src/mod.ts` statment
- an `export const tasks: Tasks = {...}` statement

tasks are named in `rad.ts` strictly by their _key_ in the `tasks` object.

```ts
export const tasks: Tasks = {
  meet: /* omitted task */,
  greet: /* omitted task */
}
```

the above file has exactly two tasks--`meet` and `greet`! simple!

`rad` will look in the working directory for your radfile by default.
if you so choose, you are welcome place it elsewhere, and tell rad where to find it using the
`-r/--radfile` flag. next up, let's define those tasks.

### tasks

tasks can take a couple of different forms. generally, you can simply refer to
the `Task` type in your radfile and get cracking. let's write a few _tasks_ of each type.

#### command tasks

command tasks are the simplest tasks. they are shell commands for rad to execute:

```ts
// rad.ts
import { Task, Tasks } from 'url/to/rad/mod.ts'

const compile: Task = `clang file.c`
const greet: Task = `echo "hello, world!"`

export const tasks: Tasks = { compile, greet }
```

command tasks are the only `'string'` inferface tasks. the associated command
will get executed by `rad` in a child process, a la `<your-shell> -c '<your-cmd>'`,
e.g. `bash -c 'echo "hello, world!"'`.

#### function tasks

function tasks are the most capable of all tasks. all other task types internally get
transformed into a function task. to use function tasks, create a POJO with a
`fn` key and function value. `fn` brings one argument--[`toolkit`](#toolkit)--that
offers a nice suite of batteries for your convenience. ⚡️

```ts
// rad.ts
import { Task, Tasks } from 'url/to/rad/mod.ts';

const build: Task = {
  fn: async toolkit => {
    const { logger, sh } = toolkit;
    await sh(`clang hello.c -o hello`);
    logger.info(`compile ok, asserting executable`);
    await sh(`./hello`); // stdout: Hello, world!
    logger.info("binary ok");
  },
};

export const tasks: Tasks = { build };
```

this is a _pretty_ basic function task. when you get to the [`toolkit`](#toolkit)
section, you will see the other _interesting_ utilities provided to do great
things with!

#### make tasks

make tasks are in honor of [gnu make](https://www.gnu.org/software/make/). our
make task is not nearly feature complete with a proper make task--but it does have one essential
core parity--providing an api to access _only files that have changed_ since the
last task run. more speficially, if offers an api to access only files that have been
modified _since_ the `target` has been last modified.
of course, it also exposes _all_ files specified by your prerequisites
as well. one _essential_ difference between our make task and proper-make tasks
is that your `onMake` function will _still run_ even if
no files have changed since the make `target` has changed--it is up to you to
_do nothing_ in the task handler if no work is warranted.

let's take inspiration from a make task in our very own source project--the build
for this website. here's a simplified version:

```ts
// rad.ts
import { Task, Tasks } from 'url/to/rad/mod.ts'

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
    }) => {
    await fs.mkdirp("public");
    logger.info("collecting prereq filenames");
    const filenames = await getPrereqFilenames();
    const html = await Promise.all(filenames.map(
      filename => fs.readFile(filename).then(
        markdown => marked(markdown)
      )
    )).then(htmlSnippets => htmlSnippets.join('\n'));
    await fs.writeFile("./public/index.html", html);
  },
};
```

if you have **many** prereqs, you should probably consider using
the `AsyncIterator` implementations referenced above so as to not eat
all of your memory 😀.

check out the type definitions for more!

### task depedencies

all task types, except command style tasks, accept an optional `dependsOn` array.
`dependsOn` is an array of task references. task references must be
**actual task references**--string based task lookups are not supported, intentionally.

```ts
// rad.ts
import { Task, Tasks } from 'url/to/rad/mod.ts'

const install: Task = {
  target: 'node_modules',
  prereqs: ['package.json'],
  onMake: async ({ sh }, { getChangedPrereqFilenames }) => {
    const changed = await getChangedPrereqFilenames()
    if (changed.length) await sh(`npm ci --verbose`)
  }
}
const lint: Task = {
  dependsOn: [install],
  fn: ({ sh }) => sh(`npm run lint`)
}
const test: Task = {
  dependsOn: [install],
  fn: ({ sh }) => sh(`npm test`)
}

const ci: Task = {
  dependsOn: [lint, test],
};

export const tasks: Tasks = {
  ci,
  install,
  lint,
  test,
}
```

sweet! now, our `ci` task should depend on lint & test tasks, of which lint
You can see `dependsOn` at work by using `--print-graph`:

```bash
$ rad ci --print-graph
└─ ci
   ├─ lint
   │  └─ install
   └─ test
      └─ install
```

### toolkit

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

well that's not _super_ helpful! let's study each these keys, one-by-one:

| key                | value                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Deno`             | see the [deno api docs](https://doc.deno.land/https/github.com/denoland/deno/releases/latest/download/lib.deno.d.ts )                                                                                   |
| `fs`               | a few sugar methods, `{ readFile, writeFile, mkdirp }` that work on strings, vs buffers, and assume utf8 for shorthand                                                                                  |
| `sh`               | execute a shell command. see the command task section above!                                                                                                                                            |
| `dependentResults` | results of `dependsOn` tasks. currently these are untyped. getting type inference here is tricky. PRs welcome!                                                                                          |
| `logger`           | the `rad` logger! a standard `Deno` logger with the commonplace log-level methods (e.g. `.info(...)`, `.debug(...)`, etc). see [the source](https://github.com/cdaringe/rad/blob/master/src/logger.ts) |
| `path`             | a direct reference to [deno node path](https://deno.land/std/node/path.ts). this API is likely to change if Deno implements a full, proper path module                                                  |
| `task`             | a reference to the internal `RadTask`                                                                                                                                                                   |
| `iter`             | `AsyncIterable` utility functions                                                                                                                                                                       |


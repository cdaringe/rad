# why not `<my-favorite-build-tool>`?

your build tool is probably great. keep using it if you love it. the intent here
it not to dump on anyone or any tool, but articulate feature gaps.

| tool         | DSL-less | static types | standalone | polyglot | incremental | debug-able | beautiful | dependency manager |
| ------------ | -------- | ------------ | ---------- | -------- | ----------- | ---------- | --------- | ------------------ |
| bazel        |          |              |            | ✓        | ✓           |            |           |                    |
| denox        |          |              |            |          |             |            |           |                    |
| gradle       |          |              |            |          | ✓           |            | ✓         | ✓                  |
| gulp/grunt   | ✓        |              |            |          |             | ✓          | ✓         |                    |
| make         |          |              | ✓          | ✓        | ✓           |            |           |                    |
| npm-scripts  | ✓        |              |            |          |             |            |           | ✓                  |
| **rad**      | ✓        | ✓            |            | ✓        | ✓           | ✓          | ✓         |                    |
| velociraptor |          | partial      |            |          |             |            |           | partial            |

ant, scons, ninja, etc were omitted. haven't used 'em! other builders, such as
cargo, dune, nx, and friends were omitted, as they are not generally considered
general purpose. npm-scripts & the Deno tools are not general purpose either,
but included merely by proximity of underlying tech stacks used.

Here are some genuine, not-trying-be-rude-opinions.

- `bazel` is complex. maybe you need that complexity. 🤷🏻‍♀️
- `gradle` is full of magic and is often hard to reason about _where_ behavior
  comes from. Once kotlin integration is first class, it's worth revisiting
  gradle.
- `gulp`/`grunt` have no make-style tasks, are generally node only,
  comparatively slow, & stringly typed in various places.
- `make` is great, but has a lame DSL and is coupled to a poor scripting
  language
- `npm-scripts`/`velociraptor` are simple, but suffer related drawbacks to gulp,
  grunt, and make.

Loose typing, unneeded DSLs, lack of great static analysis, and _other_ gaps
leave room for improvement in this space. `rad` is the first tool to bring a
subjectively _powerful_ scripting language into the build system space coupled
with great static analysis and make-capable performance.

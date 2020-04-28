# why not `<my-favorite-build-tool>`?

your build tool is probably great. keep using it if you love it.
the intent here it not to dump on anyone or any tool, but articulate feature gaps.

| tool       | DSL-less | static types | standalone | polyglot | incremental | debuggable | beautiful | dependency manager |
| ---------- | -------- | ------------ | ---------- | -------- | ----------- | ---------- | --------- | ------------------ |
| bazel      |          |              |            | ✓        | ✓           |            |           |                    |
| gradle     |          |              |            |          | ✓           |            | ✓         | ✓                  |
| gulp/grunt | ✓        |              |            |          |             | ✓          | ✓         |                    |
| make       |          |              | ✓          | ✓        | ✓           |            |           |                    |
| npm-scripts| ✓        |              |            |          |              |           |            | ✓                  |
| rad        | ✓        | ✓            |           | ✓        | ✓           | ✓          | ✓         |                    |

ant, scons, ninja, etc were omitted. haven't used 'em!

here are some genuine, not-trying-be-rude-opinions.

- bazel is complex. maybe you need that complexity. 🤷🏻‍♀️
- gradle is full of magic and is often hard to reason about _where_ behavior comes from.
- gulp/grunt have no make-style tasks, are generally node only, comparatively slow, & stringly typed in various places.
- make is great, but has a lame DSL and is coupled to a poor scripting language
- npm-scripts are simple, but suffer releated drawbacks to gulp/grunt.

loose typing, unneeded/obsolete DSLs, lack of great static analysis, and _other_ gaps
leave room for improvement in this space.

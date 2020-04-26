# why not `<my-favorite-build-tool>`?

your build tool is probably great. keep using it if you love it.
the intent here it not to dump on anyone or any tool, but articulate feature gaps.

| tool       | DSL-less | static types | standalone | polyglot | incremental | debuggable | beautiful | dependency manager |
| ---------- | -------- | ------------ | ---------- | -------- | ----------- | ---------- | --------- | ------------------ |
| bazel      |          |              |            | ✓        | ✓           |            |           |                    |
| gradle     |          | ✓ (kinda)    |            |          | ✓           |            | ✓         | ✓                  |
| gulp/grunt | ✓        |              |            |          |             | ✓          | ✓         |                    |
| make       |          |              | ✓          | ✓        | ✓           |            |           |                    |
| rad        | ✓        | ✓            | ✓          | ✓        | ✓           | ✓          | ✓         |                    |

ant, scons, ninja, etc were omitted. haven't used 'em!

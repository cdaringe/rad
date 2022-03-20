# deno esm browser

Compile `deno` typescript modules for ready-to-import browser modules.

Compiles:

- Typescript => ESM JS
- Rewrites local import maps => URL based imports

**Why**

You can't import `.ts` modules from browser `ESM`. Use this module to convert
your `deno` style typescript to be browser ready.

## Example

The following shows some deno modules you may have written, that you now want to
upload and use in the browser:

### Input modules

```
foo/
  mod.ts
bar/
  mod.ts
```

```ts
// foo/mod.ts
import { bar } from "../bar/mod.ts";
export const foo = () => `foo${bar()}`;
```

```ts
// bar/mod.ts
export const bar = () => `bar`;
```

### Compilation

Run the exported `build(...)` function:

```ts
await build({
  moduleFilenames: ["./foo/mod.ts"],
  // bar/mod.ts is compiled as well, as it
  // is part of the import graph from foo/mod.ts
});
```

Upload the outputs to some CDN or HTTP host, and you're ready to use modules
from the browser.

### Output

```
foo/
  mod.ts.{js,map}
bar/
  mod.ts.{js,map}
```

```ts
// foo/mod.ts.js
import { bar } from "https://myurl/bar/mod.ts.js";
export const foo = () => `foo${bar()}`;
# sourceMap=...
```

```ts
// bar/mod.ts.js
export const bar = () => `bar`;
# sourceMap=...
```

Finally

`import { foo } from "https://myurl/bar/mod.foo.js"`

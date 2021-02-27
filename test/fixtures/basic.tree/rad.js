// deno-lint-ignore-file
module.exports = {
  tasks: {
    a: {
      fn: () => "a",
    },
    b: {
      fn: () => "b",
      dependsOn: [
        "a",
      ],
    },
  },
};

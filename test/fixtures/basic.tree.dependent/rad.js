module.exports = {
  tasks: {
    a: {
      fn: ({ upstream }) => {
        return "a_1_" + upstream.b.value;
      },
      dependsOn: [
        "b",
      ],
    },
    b: {
      fn: ({ upstream }) => "b_2_" + upstream.c.value,
      dependsOn: [
        "c",
      ],
    },
    c: {
      fn: () => "c_3",
    },
  },
};

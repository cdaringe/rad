module.exports = {
  tasks: {
    a: {
      fn: ({ upstream }) => {
        return 'a_1_' + upstream.b.value
      },
      dependsOn: [
        'b',
        'x'
      ]
    },
    x: {
      fn: ({ upstream }) => {
        return 'x'
      },
      dependsOn: [
        'y'
      ]
    },
    y: {
      fn: ({ upstream }) => {
        return 'y'
      },
      dependsOn: [
        'z'
      ]
    },
    z: {
      fn: ({ upstream }) => {
        return 'z'
      },
      dependsOn: [
        'w'
      ]
    },
    w: {
      fn: ({ upstream }) => {
        return 'w'
      }
    },
    b: {
      fn: ({ upstream }) => 'b_2_' + upstream.c.value,
      dependsOn: [
        'c',
        'd'
      ]
    },
    c: {
      fn: () => 'c_3'
    },
    d: {
      fn: () => 'd'
    }
  }
}
// 4 3 2 1 0
// w-|
//   z-|
//     y-|
//       x-|
//     c-| |
//       b-|
//         a

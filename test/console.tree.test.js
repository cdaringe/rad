var ava = require('ava').default
var rad = require('../')
var fixtures = require('./fixtures')

ava.beforeEach(fixtures.createTestFolderContext)
ava.afterEach.always(fixtures.destroyTestFolderContext)

ava('TaskGraph:basic:dependent', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.deepMakeTreeDirname, t.context.dirname)
  var tree = await rad.createTaskGraph(radness)
  var task = tree.taskMap.a
  var cTree = rad.util.consoleTree(task)
  // 4 3 2 1 0
  // w-|
  //   z-|
  //     y-|
  //       x-|
  // c-|     |
  //   b-----|
  //         a
  var lengths = cTree.columns.map(col => col.size)
  t.deepEqual(lengths, [3, 2, 1, 1, 1])
})

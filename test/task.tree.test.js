var ava = require('ava').default
var rad = require('../')
var fixtures = require('./fixtures')

ava.beforeEach(fixtures.createTestFolderContext)
ava.afterEach.always(fixtures.destroyTestFolderContext)

ava('TaskGraph:basic', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicTreeDirname, t.context.dirname)
  var tree = await rad.createTaskGraph(radness)
  var task = tree.taskMap.b
  var res = await task.first().toPromise()
  t.is(res.value, 'b', 'first value in task graph ~= value of called task')
  t.is(res.upstream.a.value, 'a', 'upstream task value detected in graph run result graph')
  return task
})

ava('TaskGraph:basic:dependent', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicTreeDependentDirname, t.context.dirname)
  var tree = await rad.createTaskGraph(radness)
  var task = tree.taskMap.a
  var res = await task.first().toPromise()
  t.is(res.value, 'a_1_b_2_c_3', 'dependent results injected into downstream tasks')
  var height = task.height()
  t.is(height, 2)
})

ava('TaskGraph:deep:dependent', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.deepMakeTreeDirname, t.context.dirname)
  var tree = await rad.createTaskGraph(radness)
  var task = tree.taskMap.a
  var height = task.height()
  t.is(height, 4)
})

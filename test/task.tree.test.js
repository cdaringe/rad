var ava = require('ava').default
var rad = require('../')
var os = require('os')
var path = require('path')
var fs = require('fs-extra')
var fixtures = require('./fixtures')

ava.beforeEach(async function (t) {
  var dirname = path.join(os.tmpdir(), `rad-${Math.random().toString().substr(3, 5)}`)
  await fs.mkdirp(dirname)
  t.context.dirname = dirname
})
ava.afterEach.always(t => fs.remove(t.context.dirname))

ava('TaskTree:basic', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicTreeDirname, t.context.dirname)
  var tree = await rad.createTaskTree(radness)
  var task = tree.taskMap.b
  var res = await task.toPromise()
  t.is(res.value, 'b', 'first value in task graph ~= value of called task')
  t.is(res.upstream.a.value, 'a', 'upstream task value detected in graph run result graph')
})

ava('TaskTree:basic:dependent', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicTreeDependentDirname, t.context.dirname)
  var tree = await rad.createTaskTree(radness)
  var task = tree.taskMap.a
  var res = await task.toPromise()
  t.is(res.value, 'a_1_b_2_c_3', 'dependent results injected into downstream tasks')
})

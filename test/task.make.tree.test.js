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

ava('TaskMake:tree', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicMakeTreeDirname, t.context.dirname)
  var tree = await rad.createTaskTree(radness)
  var task = tree.taskMap.bundle
  var res = await task.first().toPromise()
  var testDocHelloWorld = (await fs.readFile(radness.tasks.docs.target)).toString()
  t.truthy(res.upstream.docs, 'docs task feeds bundle task')
  t.truthy(testDocHelloWorld.match(/test_world/), 'make doc task created file')
  t.truthy(await fs.exists(radness.tasks.bundle.target), 'zip archive created')
})

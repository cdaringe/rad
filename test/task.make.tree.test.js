var ava = require('ava').default
var rad = require('../')
var path = require('path')
var fs = require('fs-extra')
var fixtures = require('./fixtures')
var bluebird = require('bluebird')

ava.beforeEach(fixtures.createTestFolderContext)
ava.afterEach.always(fixtures.destroyTestFolderContext)

ava('TaskMake:tree', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicMakeTreeDirname, t.context.dirname)
  var tree = await rad.createTaskGraph(radness)
  var task = tree.taskMap.bundle
  var evt = await task.take(1).toPromise()
  var testDocHelloWorld = (await fs.readFile(radness.tasks.docs.output)).toString()
  t.truthy(evt.upstream.docs, 'docs task feeds bundle task')
  t.truthy(testDocHelloWorld.match(/test_world/), 'make doc task created file')
  t.truthy(await fs.exists(radness.tasks.bundle.output), 'zip archive created')
})

ava('TaskMake:trigger', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicMakeTreeDirname, t.context.dirname)
  var tree = await rad.createTaskGraph(radness)
  var task = tree.taskMap.docs
  var obs = task.share()
  var evtCount = 0
  obs.subscribe(() => { ++evtCount }) // @TODO WTF, why do i NEED to keep a subscription open
  // observe the initial task value
  var evt = await obs.take(1).toPromise()
  var testDocHelloWorld = (await fs.readFile(radness.tasks.docs.output)).toString()
  t.is(evt.name, 'docs', 'docs task feeds bundle task')
  t.truthy(testDocHelloWorld.match(/test_world/), 'make doc task created file')

  // observe another event after the trigger
  var evt2p = obs.take(1).toPromise()
  task.trigger.next(null)
  var evt2 = await evt2p
  t.truthy(evt2)

  // assert that exactly 2 events have occurred
  await bluebird.delay(100)
  t.is(evtCount, 2, 'exactly two events have occurred')
})

ava('TaskMake:updates-on-change', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicMakeTreeDirname, t.context.dirname)
  var tree = await rad.createTaskGraph(radness)
  var task = tree.taskMap.bundle.share()
  task.subscribe(evt => {}) // @TODO WHY DO I NEED YOU
  var docHashes = []
  var bundleHashes = []
  var res = await task.take(1).toPromise()
  docHashes = docHashes.concat(res.upstream.docs.value.inputsHashes)
  bundleHashes = bundleHashes.concat(res.value.inputsHashes)
  var testDocHelloWorld = (await fs.readFile(radness.tasks.docs.output)).toString()
  t.truthy(res.upstream.docs, 'docs task feeds bundle task')
  t.truthy(testDocHelloWorld.match(/test_world/), 'make doc task created file')
  t.truthy(await fs.exists(radness.tasks.bundle.output), 'zip archive created')

  // change the doc file, and notify manually the docs task that the file has changed
  var docsSrcFilename = path.join(t.context.dirname, 'doc.md')
  t.truthy(await fs.exists(docsSrcFilename))
  await fs.writeFile(docsSrcFilename, 'should-force-a-hash-change')
  var res2p = task.take(1).toPromise()
  tree.taskMap.docs.trigger.next(null)
  var res2 = await res2p
  docHashes = docHashes.concat(res2.upstream.docs.value.inputsHashes)
  bundleHashes = bundleHashes.concat(res2.value.inputsHashes)
  // observe that the hash on that file has changed!
  t.not(docHashes[0], docHashes[1], 'hashes unique on file after change')
  // observe that the zip file gets rebuilt by observing its hash change
  t.not(bundleHashes[0], bundleHashes[1], 'hashes unique on file after change')
})

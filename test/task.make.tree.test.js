var ava = require('ava').default
var rad = require('../')
var os = require('os')
var path = require('path')
var fs = require('fs-extra')
var fixtures = require('./fixtures')
var bluebird = require('bluebird')

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

ava('TaskMake:events', async function (t) {
  var { radness } = await fixtures.loadFixture(fixtures.basicMakeTreeDirname, t.context.dirname)
  var tree = await rad.createTaskTree(radness)
  var task = tree.taskMap.bundle
  var docHashes = []
  tree.taskMap.docs.emitter.on(rad.TaskMake.EVENTS.HASH_CHANGE, hash => {
    docHashes.push(hash)
  })
  var bundleHashes = []
  tree.taskMap.bundle.emitter.on(rad.TaskMake.EVENTS.HASH_CHANGE, hash => {
    bundleHashes.push(hash)
  })
  var res = await task.first().toPromise()
  var testDocHelloWorld = (await fs.readFile(radness.tasks.docs.target)).toString()
  t.truthy(res.upstream.docs, 'docs task feeds bundle task')
  t.truthy(testDocHelloWorld.match(/test_world/), 'make doc task created file')
  t.truthy(await fs.exists(radness.tasks.bundle.target), 'zip archive created')

  // change the doc file, and notify manually the docs task that the file has changed
  var docsSrcFilename = path.join(t.context.dirname, 'doc.md')
  t.truthy(await fs.exists(docsSrcFilename))
  await fs.writeFile(docsSrcFilename, 'should-force-a-hash-change')
  tree.taskMap.docs.trigger.next(null)

  // observe that the hash on that file has changed!
  while (docHashes.length < 2) await bluebird.delay(50)
  t.is(docHashes.length, 2, 'two hashes detected, 1 for original .md, 1 for changed .md')
  t.falsy(docHashes[0] === docHashes[1], 'hashes unique on file after change')

  // observe that the zip file get rebuilt by observing its hash change
  while (bundleHashes.length < 2) await bluebird.delay(100)
  t.is(bundleHashes.length, 2, 'two hashes detected, 1 for original .zip, 1 for changed .zip')
  t.falsy(bundleHashes[0] === bundleHashes[1], 'hashes unique on file after change')
})

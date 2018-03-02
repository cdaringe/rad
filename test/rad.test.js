var ava = require('ava').default
var rad = require('../')
var path = require('path')
var fixtures = require('./fixtures')

ava.beforeEach(fixtures.createTestFolderContext)
ava.afterEach.always(fixtures.destroyTestFolderContext)

ava('basic', async function (t) {
  var { dirname } = t.context
  await fixtures.copyContents(fixtures.basicDirname, dirname)
  var radness = await rad.init({ radFilename: path.join(dirname, 'rad.js') })
  t.truthy(radness.tasks, 'tasks found in radfile')
})

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

ava('basic', async function (t) {
  var { dirname } = t.context
  await fixtures.copyContents(fixtures.basicDirname, dirname)
  var radness = await rad.init({ radFilename: path.join(dirname, 'rad.js') })
  t.truthy(radness.tasks, 'tasks found in radfile')
})

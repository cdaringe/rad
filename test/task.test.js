var ava = require('ava').default
var rad = require('../')
var os = require('os')
var path = require('path')
var fs = require('fs-extra')
// var fixtures = require('./fixtures')

ava.beforeEach(async function (t) {
  var dirname = path.join(os.tmpdir(), `rad-${Math.random().toString().substr(3, 5)}`)
  await fs.mkdirp(dirname)
  t.context.dirname = dirname
})
ava.afterEach.always(t => fs.remove(t.context.dirname))

ava('Task:basic', async function (t) {
  var task = new rad.Task({
    name: 'test_task',
    definition: {
      fn: () => 'task_result'
    }
  })
  var res = await task.toPromise()
  t.is(res.value, 'task_result')
})

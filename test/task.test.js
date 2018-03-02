var ava = require('ava').default
var rad = require('../')
var fixtures = require('./fixtures')

ava.beforeEach(fixtures.createTestFolderContext)
ava.afterEach.always(fixtures.destroyTestFolderContext)

ava('Task:basic', async function (t) {
  var task = new rad.Task({
    name: 'test_task',
    definition: {
      fn: () => 'task_result'
    }
  })
  var res = await task.first().toPromise()
  t.is(res.value, 'task_result')
})

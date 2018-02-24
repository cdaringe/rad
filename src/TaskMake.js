var Task = require('./Task')
var invariant = require('invariant')
var hasher = require('folder-hash').hashElement
var fs = require('fs-extra')
var errors = require('./errors')

class TaskMake extends Task {
  constructor (opts) {
    super(opts)
    invariant(opts.target, 'make-style tasks must specify a target')
    this.definition.fn = async function hashTarget () {
      var target = this.definition.target
      var hash = (await fs.exists(target))
        ? await hasher(target)
        : null
      if (hash && this.lastHash === hash) return
      this.lastHash = hash
      var value = opts.definition.fn.apply(opts.definition, arguments)
      if (value && value.then && value.catch) value = await value
      if (!(await fs.exists(target))) {
        throw new errors.RadMakeTaskError(
          `task "${this.name}" target "${target}" does not exist after task`
        )
      }
      hash = await hasher(target)
      this.emitter(TaskMake.EVENTS.HASH_CHANGE, hash)
      return hash
    }.bind(this)
  }
}
TaskMake.EVENTS = Object.assign(Task.EVENTS, {
  HASH_CHANGE: 'HASH_CHANGE'
})

module.exports = TaskMake

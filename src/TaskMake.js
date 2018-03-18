var Task = require('./Task')
var hasher = require('folder-hash').hashElement
var fs = require('fs-extra')
var errors = require('./errors')
var joi = require('joi')

class TaskMake extends Task {
  constructor (opts) {
    super(opts)
    var userFn = opts.definition.fn
    this.definition.fn = async function hashTarget () {
      var target = this.definition.target
      var hash = (await fs.exists(target))
        ? await hasher(target)
        : null
      if (hash && this.lastHash === hash) return this.lastHash
      this.lastHash = hash
      var value = userFn.apply(opts.definition, arguments)
      if (value && value.then && value.catch) value = await value
      if (!(await fs.exists(target))) {
        throw new errors.RadMakeTaskError(
          `task "${this.name}" target "${target}" does not exist after task`
        )
      }
      hash = (await hasher(target)).hash
      this.emitter.emit(TaskMake.EVENTS.HASH_CHANGE, hash)
      return hash
    }.bind(this)
  }
}
TaskMake.EVENTS = Object.assign(Task.EVENTS, {
  HASH_CHANGE: 'HASH_CHANGE'
})

module.exports = TaskMake
TaskMake.schema = Object.assign({
  target: joi.string().min(1)
}, Task.schema)
TaskMake.prototype.schemad = Task.compileSchema(TaskMake)

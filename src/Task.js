var rxjs = require('rxjs')
var util = require('./util')
var execa = require('execa')
var errors = require('./errors')
var memoize = require('lodash/memoize')
var debug = require('debug')('Task')

// sugar imports
var path = require('path')
var fs = require('fs-extra')
var joi = require('joi')

class Task extends rxjs.Observable {
  constructor (opts) {
    super()
    var { name, definition } = opts
    if (name && !definition.name) definition.name = name
    try {
      joi.assert(definition, this.schemad)
    } catch (err) {
      if (!err.isJoi || !err.details) throw err
      throw new errors.RadInvalidRadFile(
        `invalid task "${name}": ${err.details.map(dt => dt.message).join(',')}`
      )
    }
    this.definition = Object.assign({}, definition) // clean copy
    this.name = name
    this.dependsOn = {}
    this.trigger = new rxjs.Subject()
    if (definition.cmd) this.commandifyTask()
    this.count = memoize(this.count)
  }
  commandifyTask () {
    this.definition.fn = async (opts) => {
      var cmd = this.definition.cmd
      var cmdStr
      if (typeof cmd === 'string') cmdStr = cmd
      try {
        cmdStr = cmdStr || cmd(opts)
      } catch (reason) {
        let err = new errors.RadTaskCmdFormationError([
          `task "${this.name}" has a malformed command. if it's a function,`,
          `please inspect any variables extracted.`
        ].join(' '))
        err.reason = reason
        throw err
      }
      try {
        var res = await execa.shell(
          cmdStr,
          {
            stdio: debug.enabled ? 'inherit' : null,
            env: Object.assign({}, process.env)
          }
        )
        return res
      } catch (reason) {
        let err = new errors.RadTaskCmdExecutionError([
          `task ${this.name} failed to execute`
        ].join(''))
        err.reason = reason
        throw err
      }
    }
  }
  count () {
    return 1 + Object.values(this.dependsOn).reduce((total, node) => total + node.count(), 0)
  }
  height () {
    var values = Object.values(this.dependsOn)
    if (!values.length) return 1
    var max = Math.max.apply(null, values.map(node => node.height()))
    return 1 + max
  }
  result (upstream) {
    return Promise.resolve(this.definition.fn({
      fs,
      path,
      task: this.definition,
      upstream
    }))
  }
  /**
   *
   * @param {Rx.Observer} observer
   */
  async _subscribe (observer) {
    if (this._taskSubject) return this._taskSubject
    var name = this.definition.name
    var dependents = Object.values(this.dependsOn).concat(this.trigger)
    var inner = rxjs.Observable.combineLatest(dependents)
    inner.subscribe(
      async function (upstream_) {
        var upstream = upstream_
          .filter(i => i)
          .reduce((agg, curr) => {
            agg[curr.name] = curr
            return agg
          }, {})
        var timer = util.timer()
        var value = await this.result(upstream)
        var duration = timer()
        var payload = {
          _task: this,
          task: this.definition,
          upstream,
          duration,
          name,
          value
        }
        debug(`task ${name} executed`)
        observer.next(payload)
      }.bind(this)
    )
    this._taskSubject = inner
        // leaf node tasks have no dependents, and are comprised only of the trigger.
    // always fire it on subscribe so the inner observable does _something_!.
    // non-leaf nodes also need it to trigger as it's part of `combineAll`
    // operator used by the inner.  needs at least 1 value to kick off.
    this.trigger.next(null)
  }
}
Task.compileSchema = function (Cls) {
  return joi.object(Cls.schema).xor('cmd', 'fn')
}

module.exports = Task
Task.schema = {
  cmd: joi.alternatives().try([
    joi.string().min(1),
    joi.func()
  ]),
  dependsOn: joi.array().items(joi.string(), joi.object().keys(Task.schema)).optional(),
  fn: joi.func(),
  name: joi.string().required().min(1)
}
Task.prototype.schemad = Task.compileSchema(Task)

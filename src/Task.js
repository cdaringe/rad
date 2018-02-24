var rxjs = require('rxjs')
var util = require('./util')
var invariant = require('invariant')
var execa = require('execa')
var errors = require('./errors')
var EventEmitter = require('events').EventEmitter
var STATE = {
  STOPPED: 1,
  RUNNING: 2,
  COMPLETE: 3
}
var EVENTS = {
}
// sugar imports
var path = require('path')
var fs = require('fs-extra')

class Task extends rxjs.Observable {
  constructor (opts) {
    super()
    var { name, definition } = opts
    this.emitter = new EventEmitter()
    this._definition = Object.assign({}, opts.definition) // clean copy
    invariant(name, 'task name required')
    invariant(definition, 'task definition required')
    if (definition.cmd) {
      invariant(!definition.fn, 'task cannot have both a `fn` and a `cmd`')
      definition.fn = async (opts) => {
        var cmd = definition.cmd
        var cmdStr
        if (typeof cmd === 'string') cmd = () => cmd
        try {
          cmdStr = cmd(opts)
        } catch (reason) {
          let err = new errors.RadTaskCmdFormationError([
            `task "${this.name}" has a malformed command. if it's a function,`,
            `please inspect any variables extracted.`
          ].join(' '))
          err.reason = reason
          throw err
        }
        try {
          return execa.shell(cmdStr)
        } catch (reason) {
          let err = new errors.RadTaskCmdExecutionError([
            `task ${this.name} failed to execute`
          ].join(''))
          err.reason = reason
          throw err
        }
      }
    }
    this.name = name
    this.definition = definition
    this._dependsOn = {}
    this._feedsInto = {}
    this.state = STATE.STOPPED
  }
  feeds (task) {
    if (!task) return this._feedsInto
    this._feedsInto[task.name] = task
    return this
  }
  dependsOn (task) {
    if (!task) return this._dependsOn
    this._dependsOn[task.name] = task
    return this
  }
  /**
   *
   * @param {Rx.Subscriber} subscriber
   */
  async _subscribe (subscriber) {
    this.state = STATE.RUNNING
    var dependents = Object.values(this._dependsOn)
    var pending = dependents.length
      ? rxjs.Observable.combineLatest(dependents)
      : rxjs.Observable.of([])
    return pending.toPromise().then(async function (upstream_) {
      var upstream = upstream_.reduce((agg, curr) => {
        agg[curr.name] = curr
        return agg
      }, {})
      var timer = util.timer()
      var value = this.definition.fn({
        path,
        fs,
        task: this._definition,
        upstream
      })
      if (value && value.then && value.catch) value = await value
      var duration = timer()
      var payload = {
        upstream,
        duration,
        name: this.name,
        value
      }
      subscriber.next(payload)
      subscriber.complete()
      this.state = STATE.COMPLETE
    }.bind(this))
  }
}
Task.STATES = STATE
Task.EVENTS = EVENTS

module.exports = Task

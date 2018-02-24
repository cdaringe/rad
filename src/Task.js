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
    this.name = name
    this.definition = definition
    this._dependsOn = {}
    this._feedsInto = {}
    this.state = STATE.STOPPED
    this.trigger = new rxjs.Subject()
    if (definition.cmd) this.commandifyTask()
  }
  commandifyTask () {
    var definition = this.definition
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
    if (this._taskSubscription) return this._taskSubscription // hot Observable'ify
    this.state = STATE.RUNNING
    var dependents = Object.values(this._dependsOn)
    dependents.push(this.trigger)
    var pending = rxjs.Observable.combineLatest(dependents)
    setTimeout(() => this.trigger.next(null), 10)
    this._taskSubscription = pending.subscribe(async function (upstream_) {
      var upstream = upstream_
        .filter(i => i)
        .reduce((agg, curr) => {
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
    }.bind(this))
    return this._taskSubscription
  }
}
Task.STATES = STATE
Task.EVENTS = EVENTS

module.exports = Task

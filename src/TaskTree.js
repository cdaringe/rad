var Tree = require('./Tree')
var Task = require('./Task')
var invariant = require('invariant')

module.exports = class TaskTree extends Tree {
  constructor (tasks) {
    super()
    var taskMap = this.taskMap = {}
    for (let name in tasks) {
      let task = new Task({ name, definition: tasks[name] })
      taskMap[name] = task
    }
    this.graph = taskMap
    this.roots = []
    for (let name in tasks) {
      let defintion = tasks[name]
      let task = taskMap[name]
      if (defintion.dependsOn && defintion.dependsOn.length) {
        for (let dependentName of defintion.dependsOn) {
          let dependent = taskMap[dependentName]
          invariant(dependent, `task "${dependentName}" requested by "${name}" not found`)
          task.dependsOn(dependent)
          taskMap[dependentName].feeds(dependent)
        }
      } else {
        this.roots.push(task)
      }
    }
  }
  async run (taskName) {
    /** @type {Rx.Observable} */
    var task = this.taskMap[taskName]
    var res = await task.toPromise()
    return res
  }
}

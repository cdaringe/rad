var Tree = require('./Tree')
var Task = require('./Task')
var TaskMake = require('./TaskMake')
var invariant = require('invariant')
var errors = require('./errors')

module.exports = class TaskTree extends Tree {
  constructor (tasks) {
    super()
    var taskMap = this.taskMap = {}
    for (let name in tasks) {
      let definition = tasks[name]
      let taskType = definition.type
      let CTor
      if (taskType) {
        if (taskType === 'make') CTor = TaskMake
        else throw new errors.RadInvalidRadFile(`unsupport type "${taskType}" for task "${name}"`)
      } else {
        CTor = Task
      }
      taskMap[name] = new CTor({ name, definition })
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

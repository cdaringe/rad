var Task = require('./Task')
var TaskMake = require('./TaskMake')
var errors = require('./errors')

module.exports = class TaskGraph {
  constructor (tasks) {
    var taskMap = this.taskMap = {}
    for (let name in tasks) {
      let definition = tasks[name]
      let CTor
      if (definition.hasOwnProperty('target')) {
        CTor = TaskMake
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
          if (!dependent) {
            throw new errors.RadInvalidRadFile(`task "${dependentName}" requested by task "${name}" not found`)
          }
          if (task.dependsOn[dependent.name]) {
            throw new errors.RadInvalidRadFile(`duplicate task "${dependent.name}" found`)
          }
          task.dependsOn[dependent.name] = dependent
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
    if (!taskName) throw new errors.RadError(`task name required, given ${toString(taskName)}`)
    if (!task) throw new errors.RadError(`task "${taskName}" not found`)
    var res = await task.toPromise()
    return res
  }
}

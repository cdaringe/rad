var Task = require('./Task')
var fs = require('fs-extra')
var joi = require('joi')
var debug = require('debug')('TaskMake')
var errors = require('./errors')
var isString = require('lodash/isString')
var xor = require('lodash/xor')
var flatten = require('lodash/flatten')
var bluebird = require('bluebird')
var util = require('util')
var globp = util.promisify(require('glob'))

class TaskMake extends Task {
  constructor (opts) {
    super(opts)
    var userFn = this.definition.fn
    this.inputs = isString(opts.definition.input)
      ? [opts.definition.input]
      : opts.definition.input
    this.fileStats = []
    this.definition.fn = async function maybePerformTask () {
      var output = this.definition.output
      var nestedGlobbedInputs = await bluebird.map(this.inputs, async input => {
        var res = await globp(input)
        return res
      })
      var globbedInputs = flatten(nestedGlobbedInputs)
      var fileStats = await this.calculateFileChanges(globbedInputs)
      var filesDiff = xor(fileStats, this.fileStats)
      if (!filesDiff.length) {
        debug(`hashes unchanged: ${this.name}`)
        return { fileStats }
      }
      debug(`hashes changed: ${this.name} [${filesDiff.join(', ')}]`)
      this.fileStats = fileStats
      await Promise.resolve(userFn.apply(this.definition, arguments))
      if (!await fs.exists(output)) {
        throw new errors.RadMakeTaskError(
          `task "${this.name}" output "${output}" does not exist after task`
        )
      }
      return { fileStats }
    }.bind(this)
  }
  async calculateFileChanges (inputs) {
    var fileHashes = await bluebird.map(inputs, async i => {
      // await fs.
      var stat = await fs.lstat(i)
      return `${i}_c:${stat.ctimeMs}_m:${stat.mtimeMs}`
    })
    return fileHashes
  }
}

module.exports = TaskMake
TaskMake.schema = Object.assign(
  {
    input: joi
      .alternatives()
      .try([
        joi.string().min(1),
        joi
          .array()
          .items(joi.string().min(1))
          .min(1)
      ])
      .required(),
    output: joi
      .alternatives()
      .try([
        joi.string().min(1),
        joi
          .array()
          .items(joi.string().min(1))
          .min(1)
      ])
      .required()
  },
  Task.schema
)
TaskMake.prototype.schemad = Task.compileSchema(TaskMake)

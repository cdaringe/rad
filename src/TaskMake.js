var Task = require('./Task')
var hasher = require('folder-hash').hashElement
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
    this.inputsHashes = []
    this.definition.fn = async function hashInput () {
      var output = this.definition.output
      var nestedGlobbedInputs = await bluebird.map(this.inputs, async input => {
        var res = await globp(input)
        return res
      })
      var globbedInputs = flatten(nestedGlobbedInputs)
      var inputsHashes = await this.calculateInputsHashes(globbedInputs)
      var hashesDiff = xor(inputsHashes, this.inputsHashes)
      if (!hashesDiff.length) {
        debug(`hashes unchanged: ${this.name}`)
        return { inputsHashes }
      }
      debug(`hashes changed: ${this.name} [${hashesDiff.join(', ')}]`)
      this.inputsHashes = inputsHashes
      await Promise.resolve(userFn.apply(this.definition, arguments))
      if (!(await fs.exists(output))) {
        throw new errors.RadMakeTaskError(
          `task "${this.name}" output "${output}" does not exist after task`
        )
      }
      return { inputsHashes }
    }.bind(this)
  }
  async calculateInputsHashes (inputs) {
    var fileHashes = await bluebird.map(inputs, i => hasher(i, { algo: 'md5' })) // md5 is faster hash
    return fileHashes.map(fh => `${fh.name}_${fh.hash}`)
  }
}

module.exports = TaskMake
TaskMake.schema = Object.assign({
  input: joi.alternatives().try([
    joi.string().min(1),
    joi.array().items(joi.string().min(1)).min(1)
  ]).required(),
  output: joi.alternatives().try([
    joi.string().min(1),
    joi.array().items(joi.string().min(1)).min(1)
  ]).required()
}, Task.schema)
TaskMake.prototype.schemad = Task.compileSchema(TaskMake)

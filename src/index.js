var fs = require('fs-extra')
var path = require('path')
var errors = require('./errors')
var Task = require('./Task')
var TaskMake = require('./TaskMake')
var TaskGraph = require('./TaskGraph')
var util = require('./util')
var DEFAULT_RADFILENAME = path.resolve(process.cwd(), 'rad.js')

var rad = {
  util,
  Task,
  TaskMake,
  async getRadFilename (radFilename) {
    if (radFilename) {
      radFilename = path.isAbsolute(radFilename)
        ? radFilename
        : path.resolve(process.cwd(), radFilename)
      if (!await fs.exists(radFilename)) {
        throw new errors.RadMissingRadFile(
          `cannot read radfile "${radFilename}". does it exist?`
        )
      }
      return radFilename
    }
    var radFileExists = await fs.exists(DEFAULT_RADFILENAME)
    if (!radFileExists) {
      throw new errors.RadMissingRadFile(
        [`cannot find radfile "${DEFAULT_RADFILENAME}"`].join('')
      )
    }
    return DEFAULT_RADFILENAME
  },
  async init (opts) {
    if (['object', 'undefined'].indexOf(typeof opts) === -1) {
      throw new errors.RadError('invalid first argument to rad.init(...)')
    }
    opts = opts || {}
    var radFilename = await this.getRadFilename(opts.radFilename)
    return require(radFilename)
  },
  createRadfile (destFolder) {
    return fs.copyFile(
      path.resolve(__dirname, '../assets/rad.js'),
      path.resolve(destFolder, 'rad.js')
    )
  },
  createTaskGraph (radness) {
    if (!radness) throw new errors.RadError('no radness passed to createGraph')
    if (!radness.tasks) { throw new errors.RadNoTasksError('no tasks defined in radfile') }
    return new TaskGraph(radness.tasks)
  }
}

module.exports = rad

var take = require('lodash/take')
class RadError extends Error {}
RadError.code = 'ERADERROR'
RadError.emoji = '🚨'
class RadMissingRadFile extends RadError {}
RadMissingRadFile.message = 'unable to find radfile. does it exist?'
RadMissingRadFile.emoji = '📃'
class RadInvalidRadFile extends RadError {}
RadInvalidRadFile.message = 'invalid radfile'
RadInvalidRadFile.emoji = '☠️'
class RadMakeTaskError extends RadError {}
RadMakeTaskError.emoji = '👴'
class RadTaskCmdFormationError extends RadError {}
RadTaskCmdFormationError.emoji = RadError.emoji
RadTaskCmdFormationError.message = 'task command malformed'
class RadTaskCmdExecutionError extends RadError {}
RadTaskCmdExecutionError.emoji = RadError.emoji
RadTaskCmdExecutionError.message = 'task command failed to execute'

class RadNoTasksError extends RadError {}
RadNoTasksError.emoji = '💣'

/**
 * bind rad friendly error handlers when running in bin mode, vs lib mode
 * @returns {undefined}
 */
function register () {
  var perish = {
    fail (err) {
      let emoji = err.constructor.emoji ? `${err.constructor.emoji} ` : ''
      var toLog
      let msg = err.message || err.constructor.message
      let reason = err.reason && err.reason.message ? err.reason.message : ''
      if (err instanceof SyntaxError) {
        emoji = RadInvalidRadFile.emoji
        toLog = `${emoji} syntax error detected\n\n${take(
          err.stack.split('\n'),
          3
        ).join('\n')}`
      } else if (err instanceof RadError) {
        toLog = `${emoji} ${msg}${reason ? `\n${reason}` : ''}`
      } else {
        if (!(err instanceof Error)) {
          console.warn(
            'warning: unhandled error is not an `Error` instance. consider looking into it.'
          )
        }
        if (err === undefined || err === null) { err = new Error('empty, unhandled error detected') }
        toLog = err && err.stack
        try {
          // stacktrace _usually_ embeds the messgae. if it doesn't, log it
          if (err.message && err.stack.indexOf(err.message) === -1) { console.error(err.message) }
        } catch (err) {
          /* pass */
        }
      }
      console.error(toLog)
      process.exit(1)
    },
    printStacktrace: true
    // add support for loggers
  }
  process.on('uncaughtException', perish.fail.bind(perish))
  process.on('unhandledRejection', perish.fail.bind(perish))
}

module.exports = {
  // base error
  RadError,

  // task errors
  RadTaskCmdFormationError,
  RadTaskCmdExecutionError,
  RadMakeTaskError,

  // config file errors
  RadMissingRadFile,
  RadInvalidRadFile,
  RadNoTasksError,

  register
}

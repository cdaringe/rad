/**
 * @typedef {Timer}
 * @param {Function} stop
 */
/**
 * return a high resolution timer
 * @returns {Timer}
 */
function timer () {
  var start = process.hrtime()
  return function stop () {
    var diff = process.hrtime(start)
    start = null
    return (diff[0] * 1e3) + (diff[1] / 1e6)
  }
}
module.exports = timer

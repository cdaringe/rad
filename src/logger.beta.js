// var Transport = require('winston-transport')

// /** Function that count occurrences of a substring in a string;
//  * @param {String} string               The string
//  * @param {String} subString            The sub string to search for
//  * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
//  *
//  * @author Vitim.us https://gist.github.com/victornpb/7736865/edit
//  * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
//  * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
//  */
// function occurrences (string, subString, allowOverlapping) {
//   string += ''
//   subString += ''
//   if (subString.length <= 0) return (string.length + 1)

//   var n = 0
//   var pos = 0
//   var step = allowOverlapping ? 1 : subString.length

//   while (true) {
//     pos = string.indexOf(subString, pos)
//     if (pos >= 0) {
//       ++n
//       pos += step
//     } else break
//   }
//   return n
// }

// class RadTransport extends Transport {
//   constructor (opts) {
//     super(opts)
//     this.clearLines = 0
//     process.on('exit', () => process.stdout.write('\n'))
//   }

//   log (info, callback) {
//     // var streamName = this.levels[info.level] > 1 ? 'stdout' : 'stderr'
//     var msg = `${info.level}: ${info.message}`
//     var out = process.stdout
//     if (true) {
//       while (this.clearLines) {
//         out.clearLine()
//         out.moveCursor(0, -1)
//         --this.clearLines
//       }
//       out.cursorTo(0)
//       out.clearLine()
//       this.clearLines += occurrences(msg, '\n')
//     } else {
//       msg += '\n'
//     }
//     out.write(msg)
//     callback()
//   }
// }

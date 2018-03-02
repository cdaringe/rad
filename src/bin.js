require('./errors').register()
var rad = require('./')
var meow = require('meow')
var last = require('lodash/last')

var cli = meow(`
  Usage
    $ rad <task>

  Options
    --radfile, -r  path/to/radfile

  Examples
    $ rad
    $ rad -r /path/to/rad.js
`, {
  flags: {
    radfile: {
      type: 'string',
      alias: 'r'
    }
  }
})

void async function suchRad () { // eslint-disable-line
  var radness = rad.init({
    radFilename: cli.flags.radfile
  })
  var tree = rad.createTaskGraph(radness)
  var taskName = last(cli.input)
  if (taskName) await tree.run(taskName)
}()

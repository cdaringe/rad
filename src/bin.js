#!/usr/local/bin/node
require('./errors').register()
var rad = require('./')
var meow = require('meow')
var last = require('lodash/last')

var cli = meow(`
  Usage
    $ rad <task>
    $ rad init # create a new rad file template in current working directory

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
  var taskName = last(cli.input)
  if (taskName === 'init') return rad.createRadfile(process.cwd())
  var radness = await rad.init({
    radFilename: cli.flags.radfile
  })
  var tree = rad.createTaskGraph(radness)
  await tree.run(taskName || 'build')
}()

var path = require('path')
var fs = require('fs-extra')
var os = require('os')

module.exports = {
  basicDirname: path.resolve(__dirname, 'basic'),
  basicTreeDirname: path.resolve(__dirname, 'basic.tree'),
  basicTreeDependentDirname: path.resolve(__dirname, 'basic.tree.dependent'),
  basicMakeTreeDirname: path.resolve(__dirname, 'basic.make.tree'),
  deepMakeTreeDirname: path.resolve(__dirname, 'deep.tree.dependent'),
  async copyContents (src, dest) {
    var files = await fs.readdir(src)
    await Promise.all(files.map(async filename => {
      if (filename === '.' || filename === '..') return
      await fs.copy(
        path.join(src, filename),
        path.join(dest, filename),
        { recursive: true }
      )
    }))
  },
  async createTestFolderContext (t) {
    var dirname = path.join(os.tmpdir(), `rad-${Math.random().toString().substr(3, 5)}`)
    await fs.mkdirp(dirname)
    t.context.dirname = dirname
  },
  async destroyTestFolderContext (t) {
    return fs.remove(t.context.dirname)
  },
  async loadFixture (src, dst) {
    await this.copyContents(src, dst)
    var radFilename = path.resolve(dst, 'rad.js')
    var radness = require(radFilename)
    return { radFilename, radness }
  }
}

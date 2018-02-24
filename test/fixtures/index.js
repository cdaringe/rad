var path = require('path')
var fs = require('fs-extra')

module.exports = {
  basicDirname: path.resolve(__dirname, 'basic'),
  basicTreeDirname: path.resolve(__dirname, 'basic.tree'),
  basicTreeDependentDirname: path.resolve(__dirname, 'basic.tree.dependent'),
  basicMakeTreeDirname: path.resolve(__dirname, 'basic.make.tree'),
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
  async loadFixture (src, dst) {
    await this.copyContents(src, dst)
    var radFilename = path.resolve(dst, 'rad.js')
    var radness = require(radFilename)
    return { radFilename, radness }
  }
}

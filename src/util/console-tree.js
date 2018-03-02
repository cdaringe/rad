var times = require('lodash/times')
var take = require('lodash/take')
var sum = require('lodash/sum')
var repeat = require('lodash/repeat')

var TOP_EDGE_CHAR = '──┐'
var STD_EDGE_CHAR = '--┤'

function getEdgeChar (node, group, groupNdx, isRootDependent) {
  var char
  if (node === root) {
    char = ''
  } else if (groupNdx === 0) {
    char = TOP_EDGE_CHAR
  } else {
    char = STD_EDGE_CHAR
  }
  return char
}
/**
 *
 * @param {Task} root
 *   0  1  2  3  4
 * 0 w──┐
 * 1    z──┐
 * 2       y──┐
 * 3          x──┐
 * 4 c──┐        |
 * 5 d--┤        |
 * 6    b--------|
 * 7             a
 */
function consoleTree (root) {
  var height = root.height()
  var columns = []
  var longEdges = [] // e.g. b. --------|
  var nodeToColumnIds = new Map()
  var count = root.count()
  var content = times(count - 1, () => null)
  for (var i = 0; i <= height; ++i) columns.push(new Map())
  function addNodeToColumn (node, i) {
    var columnIds = nodeToColumnIds.has(node)
      ? nodeToColumnIds.get(node).concat(i).sort((a, b) => a > b)
      : [i]
    nodeToColumnIds.set(node, columnIds)
    return columns[i].set(node.name, node)
  }
  function render (node, col, row, group, groupNdx, isRootDependent) {
    var dependents = Object.values(node.dependsOn())
    var char = node === root ? '' : getEdgeChar(node, group, groupNdx, isRootDependent)
    // leaf nodes
    if (!dependents.length) {
      addNodeToColumn(node, 0)
      content[row] = `${node.name}${char}`
      return col
    }
    // non-leaf nodes
    var depsChildCount = dependents.map(dep => dep.count())
    var shift = dependents.map((dep, i) => {
      var depRow = row - 1 - sum(take(depsChildCount, i))
      return render(dep, col - 1, depRow, dependents, i, root === node)
    })[0]
    var columnIndex = node === root ? col : col - shift
    // special case -- patch edge that must extend multi-column
    addNodeToColumn(node, columnIndex)
    if (isRootDependent && shift) { // e.g. b
      content[row] = `.:${columnIndex}:.${node.name}`
      longEdges.push([row, col])
    } else {
      content[row] = `.:${columnIndex}:.${node.name}${char}`
    }
    return shift
  }
  // build line contents.
  render(root, height, count - 1)

  var columnMaxChars = columns
  .map(col => Math.max.apply(null, Array.from(col.values()).map(task => task.name.length)))
  var rowWidths = columnMaxChars.map(charLen => charLen + STD_EDGE_CHAR.length)

  // print it.
  for (var rowIndex in content) {
    var row = content[rowIndex]
    var tCol = row.match(/\.:(\d+):\.(.*)/)
    if (tCol) {
      var colId = parseInt(tCol[1])
      var leftPadding = sum(take(rowWidths, colId)) - colId
      content[rowIndex] = `${repeat(' ', leftPadding)}${tCol[2]}`
    }
  }
  // special case -- add long edges
  for (var j in longEdges) {
    var [rowId, column] = longEdges[j]
    var edgeBarLength = sum(rowWidths.slice(column))
    content[rowId] = `${content[rowId]}${repeat('-', edgeBarLength)}|`
  }
  // var finalCharIndex = content[0].length
  // for (var k in content) {
  // }
  console.log(`\n
${content.join('\n')}\n
`)
  return {
    columns,
    content
  }
}

// var a = `
// d──┐
// e--┤
//    c──┐
//    b--┤
// h──┐  │
// g--┤  │
//    f--┤
//       a
// `
// var b = `
// d──┐
//    c(✓)──┐
//          b──┐
//             │
// c──┐        │
// f--┤        │
//    e--------┤
//             a

// |---- H ----|
// `
// // get tree height, H
// // when leaf detected at h of h_i, set d_i = H - h_i
//   // unwind add erybody to h_i + d_i
//   // if parent != root, width = max(column)
// console.log(a)
// console.log(b)
module.exports = consoleTree

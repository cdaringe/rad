const replaceAtIndex = (
  str: string,
  pattern: string,
  replacement: string,
  i: number,
) =>
  str.substring(0, i) + replacement +
  str.substring(i + pattern.length, str.length);

function strReplaceLast(str: string, pattern: string, replacement: string) {
  var i = str.lastIndexOf(pattern);
  if (i < 0) return str;
  return replaceAtIndex(str, pattern, replacement, i);
}

export const getReRoot = (filename: string) =>
  (oldRoot: string, newRoot: string, oldExt?: string, newExt?: string) => {
    let next = filename;
    if (oldExt && newExt) next = strReplaceLast(next, oldExt, newExt);
    return strReplaceLast(next, oldRoot, newRoot);
  };

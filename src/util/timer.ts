/**
 * create and start a timer. call the returned thunk to get the duration in ms
 */
export function timer() {
  var start = Date.now();
  return function stop() {
    return Date.now() - start;
  };
}

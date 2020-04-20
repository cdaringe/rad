export const toArray = async <T>(it: AsyncIterable<T>) => {
  const values: T[] = [];
  for await (const v of it) values.push(v);
  return values;
};

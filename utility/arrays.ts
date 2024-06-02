export function map<T, U>(arr: T[], transformer: (value: T) => U): U[] {
  return arr.map(transformer);
}

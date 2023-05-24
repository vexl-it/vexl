export default function areIncluded<T>(
  elementsToLookFor: T[],
  arrayToLookIn: T[]
): boolean {
  return elementsToLookFor.every((element) => arrayToLookIn.includes(element))
}

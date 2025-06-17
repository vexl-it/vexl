export default function areIncluded<T>(
  elementsToLookFor: readonly T[],
  arrayToLookIn: readonly T[]
): boolean {
  return elementsToLookFor.every((element) => arrayToLookIn.includes(element))
}

export function subtractArrays<T>(
  baseArray: readonly T[],
  elementsToSubtract: readonly T[]
): T[] {
  return baseArray.filter((one) => !elementsToSubtract.includes(one))
}

export function deduplicate<T>(array: readonly T[]): T[] {
  return Array.from(new Set(array))
}

export function subtractArrays<T>(
  baseArray: T[],
  elementsToSubtract: T[]
): T[] {
  return baseArray.filter((one) => !elementsToSubtract.includes(one))
}

export function deduplicate<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

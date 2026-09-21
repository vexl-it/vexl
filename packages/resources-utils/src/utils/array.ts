import {Array, pipe} from 'effect'

export function subtractArrays<T>(
  baseArray: readonly T[],
  elementsToSubtract: readonly T[]
): T[] {
  const excluded = new Set(elementsToSubtract)
  return pipe(
    baseArray,
    Array.filter((one) => !excluded.has(one))
  )
}

export function deduplicate<T>(array: readonly T[]): T[] {
  return Array.fromIterable(new Set(array))
}

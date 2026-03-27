import {Array, pipe} from 'effect'

export default function areIncluded<T>(
  elementsToLookFor: readonly T[],
  arrayToLookIn: readonly T[]
): boolean {
  return pipe(
    elementsToLookFor,
    Array.every((element) => pipe(arrayToLookIn, Array.contains(element)))
  )
}

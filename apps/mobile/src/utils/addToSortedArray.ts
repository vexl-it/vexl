export default function addToSortedArray<T>(
  array: T[],
  compare: (a: T, b: T) => number,
  equals?: (a: T, b: T) => boolean
): (item: T) => T[] {
  return (item) => {
    const index = array.findIndex((i) => compare(i, item) >= 0)

    if (index === -1) {
      return [...array, item]
    }
    
    if (equals?.(array[index], item)) {
      const toReturn = [...array]
      toReturn[index] = item
      return toReturn
    }

    return [...array.slice(0, index), item, ...array.slice(index)]
  }
}

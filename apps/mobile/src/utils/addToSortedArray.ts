export default function addToSortedArray<T>(
  inputArray: T[],
  compare: (a: T, b: T) => number,
  equals?: (a: T, b: T) => boolean
): (item: T) => T[] {
  return (item) => {
    const array = [...inputArray]

    if (equals) {
      const indexOfDuplicate = array.findIndex((i) => equals(i, item))
      if (indexOfDuplicate !== -1) array.splice(indexOfDuplicate, 1)
    }

    const index = array.findIndex((i) => compare(i, item) >= 0)

    if (index === -1) {
      array.push(item)
    } else {
      array.splice(index, 0, item)
    }

    return array
  }
}

import addToSortedArray from './addToSortedArray'

it('Adds item to correct position in the middle', () => {
  const array = [1, 2, 4, 5]
  expect(
    addToSortedArray(
      array,
      (a, b) => a - b,
      (a, b) => a === b
    )(3)
  ).toEqual([1, 2, 3, 4, 5])
})

it('Does not add the same element multiple times', () => {
  const array = [1, 2, 4, 5]
  expect(
    addToSortedArray(
      array,
      (a, b) => a - b,
      (a, b) => a === b
    )(5)
  ).toEqual([1, 2, 4, 5])
})

it('Adds item to correct position in the start', () => {
  const array = [4, 5, 6, 100]
  expect(
    addToSortedArray(
      array,
      (a, b) => a - b,
      (a, b) => a === b
    )(3)
  ).toEqual([3, 4, 5, 6, 100])
})

it('Adds item to correct position in the end', () => {
  const array = [-1, 0, 2]
  expect(
    addToSortedArray(
      array,
      (a, b) => a - b,
      (a, b) => a === b
    )(3)
  ).toEqual([-1, 0, 2, 3])
})

it('Adds to correct position when the item is duplicate', () => {
  const array = [
    {order: 1, equal: 4},
    {order: 2, equal: 3},
    {order: 3, equal: 2},
    {order: 4, equal: 1},
  ]

  expect(
    addToSortedArray(
      array,
      (a, b) => a.order - b.order,
      (a, b) => a.equal === b.equal
    )({order: 10, equal: 3})
  ).toBe([
    {order: 1, equal: 4},
    {order: 3, equal: 2},
    {order: 4, equal: 1},
    {order: 10, equal: 3},
  ])
})

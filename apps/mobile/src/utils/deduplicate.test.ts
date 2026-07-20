import deduplicate from './deduplicate'

it('Deduplicates primitive types', () => {
  expect(deduplicate([1, 2, 3, 1, 2, 3])).toEqual([1, 2, 3])
  expect(deduplicate([])).toEqual([])
  expect(deduplicate([123])).toEqual([123])
  expect(deduplicate([3, 22])).toEqual([3, 22])
})

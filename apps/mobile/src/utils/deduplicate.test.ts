import deduplicate, {deduplicateBy} from './deduplicate'

it('Deduplicates primitive types', () => {
  expect(deduplicate([1, 2, 3, 1, 2, 3])).toEqual([1, 2, 3])
  expect(deduplicate([])).toEqual([])
  expect(deduplicate([123])).toEqual([123])
  expect(deduplicate([3, 22])).toEqual([3, 22])
})

it('Deduplicates by property', () => {
  interface SomeType {
    id: string
  }

  function getProperty(v: SomeType): string {
    return v.id
  }

  expect(
    deduplicateBy(
      [{id: '1'}, {id: '1'}, {id: '1'}, {id: '1'}, {id: '1'}, {id: '1'}],
      getProperty
    )
  ).toEqual([{id: '1'}])

  expect(
    deduplicateBy(
      [{id: '2'}, {id: '1'}, {id: '2'}, {id: '3'}, {id: '1'}, {id: '1'}],
      getProperty
    )
  ).toEqual([{id: '2'}, {id: '1'}, {id: '3'}])

  expect(deduplicateBy([] as SomeType[], getProperty)).toEqual([])
})

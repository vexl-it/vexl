import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

export default function valueOrDefaultAtom<Value, Result>({
  nullableAtom,
  dummyValue,
}: {
  dummyValue: NonNullable<Value>
  nullableAtom: WritableAtom<
    Value,
    [SetStateAction<NonNullable<Value>>],
    Result
  >
}): WritableAtom<
  NonNullable<Value>,
  [SetStateAction<NonNullable<Value>>],
  Result
> {
  return atom(
    (get) => {
      return get(nullableAtom) ?? dummyValue
    },
    (get, set, update) => {
      const updateValue =
        getValueFromSetStateActionOfAtom(update)(
          () => get(nullableAtom) ?? dummyValue
        ) ?? dummyValue

      return set(nullableAtom, updateValue)
    }
  )
}

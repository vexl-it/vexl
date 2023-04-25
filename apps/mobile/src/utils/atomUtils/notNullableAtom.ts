import {atom, type Atom, type SetStateAction, type WritableAtom} from 'jotai'
import * as O from 'fp-ts/Option'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

export default function noneOrNotNullableAtom<Value>(
  nullableAtom: WritableAtom<
    Value | null | undefined,
    [SetStateAction<Value>],
    void
  >,
  fallbackValue: NonNullable<Value>
): Atom<
  O.Option<
    WritableAtom<NonNullable<Value>, [SetStateAction<NonNullable<Value>>], void>
  >
> {
  const valueOrFallbackValueAtom = atom<
    NonNullable<Value>,
    [SetStateAction<NonNullable<Value>>],
    unknown
  >(
    (get) => {
      const value = get(nullableAtom)
      return value ?? fallbackValue
    },
    (get, set, action) => {
      const value = getValueFromSetStateActionOfAtom(action)(
        () => get(nullableAtom) ?? fallbackValue
      )
      if (value !== null && value !== undefined) set(nullableAtom, value)
    }
  )

  return atom((get) => {
    const value = get(nullableAtom)
    if (value === null || value === undefined) {
      return O.none
    } else {
      return O.some(valueOrFallbackValueAtom)
    }
  })
}

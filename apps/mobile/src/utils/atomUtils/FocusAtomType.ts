import {type SetStateAction, type WritableAtom} from 'jotai'

type FocusAtomType<T> = WritableAtom<
  T,
  [SetStateAction<NonNullable<T>>],
  unknown
>

export {type FocusAtomType}

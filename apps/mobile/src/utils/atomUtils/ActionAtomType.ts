import {type WritableAtom} from 'jotai'

type ActionAtomType<Args extends unknown[], Result> = WritableAtom<
  null,
  Args,
  Result
>

export type {ActionAtomType}

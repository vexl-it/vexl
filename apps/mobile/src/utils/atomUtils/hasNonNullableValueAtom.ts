import {selectAtom} from 'jotai/utils'
import {type Atom} from 'jotai'

export default function hasNonNullableValueAtom(
  atom: Atom<any>
): Atom<boolean> {
  return selectAtom(atom, (value) => {
    return value !== null && value !== undefined
  })
}

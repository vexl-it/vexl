import {type Atom, atom} from 'jotai'

export default function hasNonNullableValueAtom(
  valueAtom: Atom<any>
): Atom<boolean> {
  return atom((get) => {
    const value = get(valueAtom)
    return value !== null && value !== undefined
  })
}

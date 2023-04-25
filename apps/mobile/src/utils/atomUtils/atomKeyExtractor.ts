import {type Atom} from 'jotai'

export default function atomKeyExtractor(atom: Atom<any>): string {
  return atom.toString()
}

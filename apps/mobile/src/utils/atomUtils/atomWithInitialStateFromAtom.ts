import {type Atom, atom, type PrimitiveAtom, type SetStateAction} from 'jotai'
import * as O from 'fp-ts/Option'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'
import {pipe} from 'fp-ts/function'

export function atomWithInitialStateFromAtom<T>(
  initialValueAtom: Atom<T>
): PrimitiveAtom<T> {
  const valueAtom = atom<O.Option<T>>(O.none)

  const resultAtom = atom(
    (get) =>
      pipe(
        get(valueAtom),
        O.match(
          () => get(initialValueAtom),
          (v) => v
        )
      ),
    (get, set, update: SetStateAction<T>) => {
      const newValue = getValueFromSetStateActionOfAtom(update)(() =>
        get(resultAtom)
      )
      set(valueAtom, O.some(newValue))
    }
  )
  return resultAtom
}

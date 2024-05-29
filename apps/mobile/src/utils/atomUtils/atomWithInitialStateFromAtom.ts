import * as O from 'fp-ts/Option'
import {pipe} from 'fp-ts/function'
import {atom, type Atom, type PrimitiveAtom, type SetStateAction} from 'jotai'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

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

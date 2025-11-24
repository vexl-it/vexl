import {Option, pipe} from 'effect'
import {atom, type Atom, type PrimitiveAtom, type SetStateAction} from 'jotai'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

export function atomWithInitialStateFromAtom<T>(
  initialValueAtom: Atom<T>
): PrimitiveAtom<T> {
  const valueAtom = atom<Option.Option<T>>(Option.none())

  const resultAtom = atom(
    (get) =>
      pipe(
        get(valueAtom),
        Option.match({
          onNone: () => get(initialValueAtom),
          onSome: (v) => v,
        })
      ),
    (get, set, update: SetStateAction<T>) => {
      const newValue = getValueFromSetStateActionOfAtom(update)(() =>
        get(resultAtom)
      )
      set(valueAtom, Option.some(newValue))
    }
  )
  return resultAtom
}

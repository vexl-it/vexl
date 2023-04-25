import {type SetStateAction} from 'jotai'

export default function getValueFromSetStateActionOfAtom<T>(
  setStateAction: SetStateAction<T>
): (getValue: () => T) => T {
  return (getValue) => {
    if (typeof setStateAction === 'function') {
      return (setStateAction as (val: T) => T)(getValue())
    }
    return setStateAction
  }
}

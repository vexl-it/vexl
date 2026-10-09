import {atom, useSetAtom, type PrimitiveAtom} from 'jotai'
import {useEffect, useState} from 'react'

/** Mirrors a scripted value into an atom, for ui components that read their value from one. */
export function useValueAtom<T>(value: T): PrimitiveAtom<T> {
  const [valueAtom] = useState(() => atom(value))
  const setValue = useSetAtom(valueAtom)
  useEffect(() => {
    setValue(value)
  }, [setValue, value])
  return valueAtom
}

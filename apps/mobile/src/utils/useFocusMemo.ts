import {useFocusEffect} from '@react-navigation/native'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {useAtomValue, type Atom} from 'jotai'
import {useCallback, useMemo, useState} from 'react'

export default function useFocusMemo<T>(factory: () => T): T {
  const [focusedAt, setFocusedAt] = useState(() => unixMillisecondsNow())

  useFocusEffect(
    useCallback(() => {
      setFocusedAt(unixMillisecondsNow())
    }, [setFocusedAt])
  )

  return useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    focusedAt
    return factory()
  }, [factory, focusedAt])
}

export function useAtomValueRefreshOnFocus<T>(factory: () => Atom<T>): T {
  const [focusedAt, setFocusedAt] = useState(() => unixMillisecondsNow())

  useFocusEffect(
    useCallback(() => {
      setFocusedAt(unixMillisecondsNow())
    }, [setFocusedAt])
  )

  return useAtomValue(
    useMemo(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      focusedAt
      return factory()
    }, [factory, focusedAt])
  )
}

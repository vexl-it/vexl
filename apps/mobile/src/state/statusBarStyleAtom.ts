import {useFocusEffect} from '@react-navigation/native'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'

const STATUS_BAR_DEFAULT: 'primary' | 'secondary' = 'primary'
export const StatusBarStyleAtom = atom<'primary' | 'secondary'>(
  STATUS_BAR_DEFAULT
)

export const useStatusBarStyleForScreen = (
  style: 'primary' | 'secondary'
): void => {
  const setStatusBarStyle = useSetAtom(StatusBarStyleAtom)

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style)

      return () => {
        setStatusBarStyle(STATUS_BAR_DEFAULT)
      }
    }, [setStatusBarStyle, style])
  )
}

import {useFocusEffect} from '@react-navigation/native'
import {useCallback} from 'react'
import {useAppState} from './useAppState'

export function useOnFocusAndAppState(callback: () => void): void {
  useFocusEffect(callback)
  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') callback()
      },
      [callback]
    )
  )
}

import {useFocusEffect} from '@react-navigation/native'
import {useAppState} from '../../utils/useAppState'
import {useCallback} from 'react'

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

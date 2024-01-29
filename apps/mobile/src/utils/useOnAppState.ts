import {useCallback} from 'react'
import {useAppState} from './useAppState'

export function useOnAppState(callback: () => void): void {
  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') callback()
      },
      [callback]
    )
  )
}

import {AppState, type AppStateStatus} from 'react-native'
import {useEffect} from 'react'

export function useAppState(callback: (state: AppStateStatus) => void): void {
  useEffect(() => {
    if (AppState.currentState === 'active') {
      // eslint-disable-next-line n/no-callback-literal
      callback('active')
    }
    return AppState.addEventListener('change', callback).remove
  }, [callback])
}

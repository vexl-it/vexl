import {AppState, type AppStateStatus} from 'react-native'
import {useEffect} from 'react'

export function useAppState(callback: (state: AppStateStatus) => void): void {
  useEffect(() => {
    return AppState.addEventListener('change', callback).remove
  }, [callback])
}

import {AppState, type AppStateStatus} from 'react-native'
import {useEffect} from 'react'

export function useAppState(
  callback: (state: AppStateStatus) => void,
  runCallbackOnInit: boolean = true
): void {
  useEffect(() => {
    if (runCallbackOnInit) callback(AppState.currentState)
    return AppState.addEventListener('change', callback).remove
  }, [callback, runCallbackOnInit])
}

import {useEffect} from 'react'
import {AppState, type AppStateStatus} from 'react-native'

export function useAppState(
  callback: (state: AppStateStatus) => void,
  runCallbackOnInit: boolean = true
): void {
  useEffect(() => {
    if (runCallbackOnInit) callback(AppState.currentState)
    return AppState.addEventListener('change', callback).remove
  }, [callback, runCallbackOnInit])
}

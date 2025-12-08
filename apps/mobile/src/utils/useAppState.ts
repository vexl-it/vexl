import {useEffect, useState} from 'react'
import {AppState, type AppStateStatus} from 'react-native'

export function useAppState(
  callback:
    | ((state: AppStateStatus) => () => void)
    | ((state: AppStateStatus) => void)
): void {
  const [appState, setAppState] = useState<AppStateStatus | null>(
    AppState.currentState
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState)
    return () => {
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    if (appState === null) return
    const cleanup = callback(appState)
    if (cleanup) return cleanup
  }, [appState, callback])
}

import {
  useNavigation,
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native'
import {useCallback, useRef} from 'react'

interface Params {
  enabled: boolean
  confirmLeave: () => Promise<boolean>
  fallbackLeave?: () => void
}

// Intercepts screen-removal navigation, waits for async confirmation, and then
// resumes the originally blocked navigation action when leaving is allowed.
export default function usePreventDiscardChangesWithConfirmation({
  enabled,
  confirmLeave,
  fallbackLeave,
}: Params): {
  allowNextRemove: () => void
  leaveWithoutConfirmation: () => void
} {
  const navigation = useNavigation()
  const allowNextRemoveRef = useRef(false)
  const pendingNavigationActionRef = useRef<NavigationAction | undefined>(
    undefined
  )

  const leaveWithoutConfirmation = useCallback((): void => {
    allowNextRemoveRef.current = true
    const action = pendingNavigationActionRef.current
    pendingNavigationActionRef.current = undefined

    if (action) {
      navigation.dispatch(action)
      return
    }

    fallbackLeave?.()
  }, [fallbackLeave, navigation])

  const allowNextRemove = useCallback((): void => {
    allowNextRemoveRef.current = true
  }, [])

  usePreventRemove(enabled, ({data}) => {
    if (allowNextRemoveRef.current) {
      navigation.dispatch(data.action)
      return
    }

    pendingNavigationActionRef.current = data.action
    void confirmLeave()
      .then((confirmed) => {
        if (confirmed) {
          leaveWithoutConfirmation()
        } else {
          pendingNavigationActionRef.current = undefined
        }
      })
      .catch(() => {
        pendingNavigationActionRef.current = undefined
      })
  })

  return {allowNextRemove, leaveWithoutConfirmation}
}

import {useAtom} from 'jotai'
import {useEffect} from 'react'
import {Stack} from 'tamagui'
import {toastNotificationAtom} from './atom'
import ToastNotificationContent from './components/ToastNotificationContent'

function ToastNotification(): JSX.Element {
  const [state, setState] = useAtom(toastNotificationAtom)

  useEffect(() => {
    if (state) {
      const timeout = setTimeout(
        () => {
          setState(null)
        },
        state?.hideAfterMillis ?? 1000
      )

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [setState, state])

  return (
    // this view has to be present in tree
    // without it exiting animation on Toast will not work
    <Stack pos="absolute" alignSelf="center" top={-10}>
      {!!state && <ToastNotificationContent {...state} />}
    </Stack>
  )
}

export default ToastNotification

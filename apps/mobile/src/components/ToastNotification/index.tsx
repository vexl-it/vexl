import {useAtom} from 'jotai'
import {useEffect} from 'react'
import {Stack} from 'tamagui'
import {toastNotificationAtom} from './atom'
import ToastNotificationContent from './components/ToastNotificationContent'

function ToastNotification(): JSX.Element {
  const [state, setState] = useAtom(toastNotificationAtom)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setState({...state, visible: false})
    }, state?.hideAfterMillis ?? 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [setState, state])

  return (
    // this view has to be present in tree
    // without it exiting animation on Toast will not work
    <Stack
      pos="absolute"
      alignSelf="center"
      left={0}
      right={0}
      {...(state?.position === 'bottom' ? {bottom: -10} : {top: -10})}
    >
      {state.visible ? <ToastNotificationContent {...state} /> : <></>}
    </Stack>
  )
}

export default ToastNotification

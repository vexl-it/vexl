import {useAtom} from 'jotai'
import React, {useEffect} from 'react'
import {Stack} from 'tamagui'
import {toastNotificationAtom} from './atom'
import ToastNotificationContent from './components/ToastNotificationContent'

function ToastNotification(): React.ReactElement {
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
      {...(state?.position === 'top' ? {top: -10} : {bottom: -10})}
    >
      <ToastNotificationContent {...state} />
    </Stack>
  )
}

export default ToastNotification

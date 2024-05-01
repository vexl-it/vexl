import {atom, useAtom} from 'jotai'
import {useEffect} from 'react'
import {Stack} from 'tamagui'
import {type SvgString} from '../../../../../packages/domain/src/utility/SvgString.brand'
import ToastNotificationContent from './components/ToastNotificationContent'

export interface ToastNotificationState {
  text: string
  icon: SvgString
}
export const toastNotificationAtom = atom<ToastNotificationState | null>(null)

function ToastNotification(): JSX.Element {
  const [state, setState] = useAtom(toastNotificationAtom)

  useEffect(() => {
    if (state) {
      const timeout = setTimeout(() => {
        setState(null)
      }, 1000)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [setState, state])

  return (
    // this view has to be present in tree
    // without it existing animation on Toast will not work
    <Stack pos="absolute" alignSelf="center" top={-10}>
      {!!state && <ToastNotificationContent {...state} />}
    </Stack>
  )
}

export default ToastNotification

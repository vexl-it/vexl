import {Toast} from '@vexl-next/ui'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {toastNotificationAtom} from './atom'

function ToastNotification(): React.JSX.Element {
  const {top: insetTop} = useSafeAreaInsets()

  return <Toast topOffset={insetTop} messageAtom={toastNotificationAtom} />
}

export default ToastNotification

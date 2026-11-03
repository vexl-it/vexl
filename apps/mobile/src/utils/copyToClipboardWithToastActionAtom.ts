import Clipboard from '@react-native-clipboard/clipboard'
import {atom} from 'jotai'
import {toastNotificationAtom} from '../components/ToastNotification/atom'
import {translationAtom} from './localization/I18nProvider'

export const copyToClipboardWithToastActionAtom = atom(
  null,
  (get, set, value: string) => {
    Clipboard.setString(value)
    set(toastNotificationAtom, get(translationAtom).t('common.copied'))
  }
)

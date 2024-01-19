import Clipboard from '@react-native-clipboard/clipboard'
import {getDefaultStore} from 'jotai'
import {Alert} from 'react-native'
import {translationAtom} from './localization/I18nProvider'

interface ShowErrorAlertParams {
  title: string
  subtitle?: string
  error?: unknown
}

export default function showErrorAlert({
  title,
  subtitle,
  error,
}: ShowErrorAlertParams): void {
  const {t} = getDefaultStore().get(translationAtom)
  Alert.alert(title, subtitle, [
    {text: t('common.ok')},
    {
      text: t('common.copyErrorToClipboard'),
      onPress: () => {
        Clipboard.setString(JSON.stringify(error, null, 2))
      },
    },
  ])
}

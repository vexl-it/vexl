import {Alert} from 'react-native'
import {getDefaultStore} from 'jotai'
import {translationAtom} from './localization/I18nProvider'
import Clipboard from '@react-native-clipboard/clipboard'

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

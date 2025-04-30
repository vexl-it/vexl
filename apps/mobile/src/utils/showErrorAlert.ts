import Clipboard from '@react-native-clipboard/clipboard'
import {Effect} from 'effect'
import {getDefaultStore} from 'jotai'
import {Alert} from 'react-native'
import {translationAtom} from './localization/I18nProvider'

interface ShowErrorAlertParams {
  title: string
  subtitle?: string
  error?: unknown
  onClosed?: () => void
}

export default function showErrorAlert({
  title,
  subtitle,
  error,
  onClosed,
}: ShowErrorAlertParams): void {
  const {t} = getDefaultStore().get(translationAtom)
  Alert.alert(title, subtitle, [
    {
      text: t('common.ok'),
      onPress: onClosed,
    },
    {
      text: t('common.copyErrorToClipboard'),
      onPress: () => {
        Clipboard.setString(JSON.stringify(error, null, 2))
        onClosed?.()
      },
    },
  ])
}

export const showErrorAlertE = (
  params: Omit<ShowErrorAlertParams, 'onClosed'>
): Effect.Effect<void> =>
  Effect.async((cb) => {
    showErrorAlert({
      ...params,
      onClosed: () => {
        cb(Effect.void)
      },
    })
  })

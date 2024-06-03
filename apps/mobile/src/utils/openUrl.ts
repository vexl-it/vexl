import Clipboard from '@react-native-clipboard/clipboard'
import {getDefaultStore} from 'jotai'
import {Alert, Linking} from 'react-native'
import {translationAtom} from './localization/I18nProvider'

export default function openUrl(
  url: string,
  textToCopyInCaseOfFail?: string,
  copy?: {
    errorTitle?: string
    errorText?: string
    errorCancelText?: string
    errorCopyText?: string
  }
): () => void {
  const {t} = getDefaultStore().get(translationAtom)
  return () => {
    void Linking.openURL(url).catch(() => {
      Alert.alert(
        copy?.errorTitle ?? t('common.errorOpeningLink.message'),
        copy?.errorText ?? t('common.errorOpeningLink.text'),
        [
          {
            style: 'cancel',
            text: copy?.errorCancelText ?? t('common.cancel'),
            onPress: () => {},
          },
          {
            style: 'default',
            text: copy?.errorCopyText ?? t('common.errorOpeningLink.copy'),
            onPress: () => {
              Clipboard.setString(textToCopyInCaseOfFail ?? url)
            },
          },
        ]
      )
    })
  }
}

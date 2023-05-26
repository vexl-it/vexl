import {Alert, Linking} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {getDefaultStore} from 'jotai'
import {translationAtom} from './localization/I18nProvider'

export default function openUrl(
  url: string,
  textToCopyInCaseOfFail?: string
): () => void {
  const {t} = getDefaultStore().get(translationAtom)
  return () => {
    void Linking.openURL(url).catch(() => {
      Alert.alert(
        t('common.errorOpeningLink.message'),
        t('common.errorOpeningLink.text'),
        [
          {
            style: 'cancel',
            text: t('common.cancel'),
            onPress: () => {},
          },
          {
            style: 'default',
            text: t('common.errorOpeningLink.copy'),
            onPress: () => {
              Clipboard.setString(textToCopyInCaseOfFail ?? url)
            },
          },
        ]
      )
    })
  }
}

import {Option} from 'effect/index'
import * as Device from 'expo-device'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Linking, Platform} from 'react-native'
import {type YStackProps} from 'tamagui'
import {notificationsEnabledAtom} from '../state/notifications/areNotificationsEnabledAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import MarketplaceSuggestion from './MarketplaceSuggestion'

export default function EnableBackgroundFetchSuggestion(
  props: YStackProps
): React.ReactElement | null {
  const {t} = useTranslation()
  const notificationsSettings = useAtomValue(notificationsEnabledAtom)

  if (Option.isNone(notificationsSettings)) return null // state not updated

  const notificationsEnabledButBackgroundFetchDisabled =
    notificationsSettings.value.notifications &&
    !notificationsSettings.value.backgroundTasks

  // ON iOS simulator, Background Fetch is always disabled
  if (!Device.isDevice && Platform.OS === 'ios') return null

  if (notificationsEnabledButBackgroundFetchDisabled)
    return (
      <MarketplaceSuggestion
        buttonText={t('common.openSettings')}
        onButtonPress={() => {
          void Linking.openSettings()
        }}
        type="warning"
        text={t(
          'notifications.weHaveNoticedThatBackgroundAppRefreshIsCurrentlyDisabled'
        )}
        {...props}
      />
    )

  return null
}

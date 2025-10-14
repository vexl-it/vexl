import {useAtomValue} from 'jotai'
import React from 'react'
import {Linking} from 'react-native'
import {type YStackProps} from 'tamagui'
import {isBackgroundFetchEnabledAtom} from '../state/notifications/isBackgroundFetchEnabledAtom'
import {useTranslation} from '../utils/localization/I18nProvider'
import MarketplaceSuggestion from './MarketplaceSuggestion'

export default function EnableBackgroundFetchSuggestion(
  props: YStackProps
): React.ReactElement | null {
  const {t} = useTranslation()
  const isBackgroundFetchEnabled = useAtomValue(isBackgroundFetchEnabledAtom)

  if (isBackgroundFetchEnabled) return null

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
}

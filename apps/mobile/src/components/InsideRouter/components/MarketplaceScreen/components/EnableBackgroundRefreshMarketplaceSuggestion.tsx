import {useSetAtom} from 'jotai'
import React from 'react'
import {Linking} from 'react-native'
import {dismissEnableBackgroundRefreshInMarketplaceSuggestionActionAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import DismissableMarketplaceBanner from './DismissableMarketplaceBanner'

function EnableBackgroundRefreshMarketplaceSuggestion(): React.ReactElement {
  const {t} = useTranslation()
  const dismissEnableBackgroundRefreshSuggestion = useSetAtom(
    dismissEnableBackgroundRefreshInMarketplaceSuggestionActionAtom
  )

  return (
    <DismissableMarketplaceBanner
      color="pink"
      title={t('marketplace.enableBackgroundRefreshSuggestion.title')}
      description={t(
        'marketplace.enableBackgroundRefreshSuggestion.description'
      )}
      primaryButton={{
        label: t('marketplace.enableBackgroundRefreshSuggestion.button'),
        onPress: () => {
          void Linking.openSettings()
        },
      }}
      secondaryButton={{
        label: t('marketplace.enableBackgroundRefreshSuggestion.dismiss'),
        onPress: () => {
          dismissEnableBackgroundRefreshSuggestion()
        },
      }}
    />
  )
}

export default EnableBackgroundRefreshMarketplaceSuggestion

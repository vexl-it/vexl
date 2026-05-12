import {useSetAtom} from 'jotai'
import React from 'react'
import {dismissEnableNotificationsInMarketplaceSuggestionActionAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import DismissableMarketplaceBanner from './DismissableMarketplaceBanner'
import useEnableNotificationsFromMarketplaceAction from './useEnableNotificationsFromMarketplaceAction'

function EnableNotificationsMarketplaceSuggestion(): React.ReactElement {
  const {t} = useTranslation()
  const enableNotifications = useEnableNotificationsFromMarketplaceAction()
  const dismissEnableNotificationsSuggestion = useSetAtom(
    dismissEnableNotificationsInMarketplaceSuggestionActionAtom
  )

  return (
    <DismissableMarketplaceBanner
      color="pink"
      title={t('marketplace.enableNotificationsSuggestion.title')}
      description={t('marketplace.enableNotificationsSuggestion.description')}
      primaryButton={{
        label: t('marketplace.enableNotificationsSuggestion.button'),
        onPress: () => {
          enableNotifications()
        },
      }}
      secondaryButton={{
        label: t('marketplace.enableNotificationsSuggestion.dismiss'),
        onPress: () => {
          dismissEnableNotificationsSuggestion()
        },
      }}
    />
  )
}

export default EnableNotificationsMarketplaceSuggestion

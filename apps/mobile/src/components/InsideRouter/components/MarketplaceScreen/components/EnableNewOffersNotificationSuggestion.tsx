import {useAtom, useSetAtom} from 'jotai'
import {type YStackProps} from 'tamagui'
import {resolveAllContactsAsSeenActionAtom} from '../../../../../state/contacts/atom/contactsStore'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useNotificationsEnabled} from '../../../../../utils/notifications'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {notificationPreferencesAtom} from '../../../../../utils/preferences'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

function EnableNewOffersNotificationSuggestion(
  props: YStackProps
): JSX.Element | null {
  const {t} = useTranslation()
  const checkAndAskForNotificationPermissions = useSetAtom(
    checkNotificationPermissionsAndAskIfPossibleActionAtom
  )
  const [notificationPreferences, setNotificationPreferences] = useAtom(
    notificationPreferencesAtom
  )
  const notificationsEnabled = useNotificationsEnabled()

  if (notificationPreferences.newOfferInMarketplace && notificationsEnabled)
    return null

  return (
    <MarketplaceSuggestion
      buttonText={t('suggestion.enableNotificationsForNewOffers.button')}
      onButtonPress={() => {
        void checkAndAskForNotificationPermissions()
        setNotificationPreferences((prev) => ({
          ...prev,
          newOfferInMarketplace: true,
        }))
      }}
      text={t('suggestion.enableNotificationsForNewOffers.text')}
      visibleStateAtom={resolveAllContactsAsSeenActionAtom}
      {...props}
    />
  )
}

export default EnableNewOffersNotificationSuggestion

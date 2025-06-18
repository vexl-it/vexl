import {Effect} from 'effect'
import {atom, useSetAtom} from 'jotai'
import {type YStackProps} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {
  areNotificationsEnabledAtom,
  checkAndSetAreNotificationsEnabledActionAtom,
} from '../../../../../utils/notifications/areNotificaitonsEnabledAtom'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../../../utils/notifications/checkAndAskForPermissionsActionAtom'
import {notificationPreferencesAtom} from '../../../../../utils/preferences'
import MarketplaceSuggestion from '../../../../MarketplaceSuggestion'

const showEnableNewOfferNotificationCancelledAtom = atom(false)

const showEnableNewOfferNotificationAtom = atom(
  (get) =>
    !get(showEnableNewOfferNotificationCancelledAtom) &&
    !(
      get(notificationPreferencesAtom).newOfferInMarketplace &&
      get(areNotificationsEnabledAtom)
    ),
  (get, set) => {
    set(showEnableNewOfferNotificationCancelledAtom, true)
  }
)

function EnableNewOffersNotificationSuggestion(
  props: YStackProps
): JSX.Element | null {
  const {t} = useTranslation()
  const checkAndAskForNotificationPermissions = useSetAtom(
    checkNotificationPermissionsAndAskIfPossibleActionAtom
  )
  const setNotificationPreferences = useSetAtom(notificationPreferencesAtom)
  const checkAndSetAreNotificationsEnabled = useSetAtom(
    checkAndSetAreNotificationsEnabledActionAtom
  )

  return (
    <MarketplaceSuggestion
      buttonText={t('suggestion.enableNotificationsForNewOffers.button')}
      onButtonPress={() => {
        Effect.runFork(
          checkAndAskForNotificationPermissions({force: true}).pipe(
            Effect.andThen(() => {
              setNotificationPreferences((prev) => ({
                ...prev,
                newOfferInMarketplace: true,
              }))
            }),
            Effect.andThen(() => {
              checkAndSetAreNotificationsEnabled()
            })
          )
        )
      }}
      text={t('suggestion.enableNotificationsForNewOffers.text')}
      visibleStateAtom={showEnableNewOfferNotificationAtom}
      {...props}
    />
  )
}

export default EnableNewOffersNotificationSuggestion

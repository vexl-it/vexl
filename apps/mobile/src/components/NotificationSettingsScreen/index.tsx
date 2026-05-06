import {Effect} from 'effect'
import {atom, type SetStateAction} from 'jotai'
import {focusAtom} from 'jotai-optics'
import React, {useMemo} from 'react'
import {ScrollView} from 'react-native'
import {getTokens, YStack} from 'tamagui'
import {syncVexlNotificationTokensActionAtom} from '../../state/notifications/actions/syncVexlNotificationTokensActionAtom'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {notificationPreferencesAtom} from '../../utils/preferences'
import {reportErrorE} from '../../utils/reportError'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import PreferenceItem from './components/PreferenceItem'

const notificationPreferencesToShow = [
  'marketing',
  'chat',
  'inactivityWarnings',
  // 'newPhoneContacts',
  'newOfferInMarketplace',
] as const

function NotificationSettingsScreen(): React.ReactElement {
  const {t} = useTranslation()
  const marketingNotificationPreferenceAtom = useMemo(
    () =>
      atom(
        (get) => get(notificationPreferencesAtom).marketing,
        (get, set, update: SetStateAction<boolean>) => {
          const marketing = getValueFromSetStateActionOfAtom(update)(
            () => get(notificationPreferencesAtom).marketing
          )

          set(notificationPreferencesAtom, (prev) => ({
            ...prev,
            marketing,
          }))

          set(syncVexlNotificationTokensActionAtom, {})
            .pipe(
              Effect.tapError((e) =>
                reportErrorE(
                  'warn',
                  new Error('Error syncing marketing notification preference'),
                  {e}
                )
              )
            )
            .pipe(Effect.runFork)
        }
      ),
    []
  )

  const contents = useMemo(() => {
    return notificationPreferencesToShow.map((one) => ({
      title: t(`notifications.preferences.${one}.title`),
      description: t(`notifications.preferences.${one}.body`),
      atom:
        one === 'marketing'
          ? marketingNotificationPreferenceAtom
          : focusAtom(notificationPreferencesAtom, (o) => o.prop(one)),
    }))
  }, [marketingNotificationPreferenceAtom, t])

  return (
    <Screen customHorizontalPadding={getTokens().space[2].val}>
      <ScreenTitle
        text={t('notifications.preferences.screenTitle')}
        withBackButton
      />
      <ScrollView>
        <YStack gap={6}>
          {contents.map((one) => (
            <PreferenceItem key={one.atom.toString()} {...one} />
          ))}
        </YStack>
      </ScrollView>
    </Screen>
  )
}

export default NotificationSettingsScreen

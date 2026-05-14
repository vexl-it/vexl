import {
  ChevronLeft,
  NavigationBar,
  Screen,
  Switch,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, Effect, pipe} from 'effect'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import React, {useMemo} from 'react'
import {syncVexlNotificationTokensActionAtom} from '../../state/notifications/actions/syncVexlNotificationTokensActionAtom'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {notificationPreferencesAtom} from '../../utils/preferences'
import {reportErrorE} from '../../utils/reportError'
import useSafeGoBack from '../../utils/useSafeGoBack'

type NotificationPreference =
  | 'marketing'
  | 'chat'
  | 'inactivityWarnings'
  | 'newOfferInMarketplace'

interface PreferenceContent {
  readonly id: NotificationPreference
  readonly title: string
  readonly description: string
  readonly atom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}

const notificationPreferencesToShow: readonly NotificationPreference[] = [
  'marketing',
  'chat',
  'inactivityWarnings',
  'newOfferInMarketplace',
]

function PreferenceCard({
  title,
  description,
  atom: valueAtom,
}: Omit<PreferenceContent, 'id'>): React.ReactElement {
  return (
    <XStack
      alignItems="center"
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      gap="$3"
      justifyContent="center"
      padding="$5"
    >
      <YStack flex={1} gap="$2">
        <Typography
          color="$foregroundPrimary"
          letterSpacing={0}
          variant="paragraph"
        >
          {title}
        </Typography>
        <Typography
          color="$foregroundSecondary"
          letterSpacing={0}
          variant="micro"
        >
          {description}
        </Typography>
      </YStack>
      <Switch aria-label={title} valueAtom={valueAtom} />
    </XStack>
  )
}

function NotificationSettingsScreen(): React.ReactElement {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
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

  const contents = useMemo<readonly PreferenceContent[]>(() => {
    return pipe(
      notificationPreferencesToShow,
      Array.map((one) => {
        return {
          id: one,
          title: t(`notifications.preferences.${one}.title`),
          description: t(`notifications.preferences.${one}.body`),
          atom:
            one === 'marketing'
              ? marketingNotificationPreferenceAtom
              : focusAtom(notificationPreferencesAtom, (o) => o.prop(one)),
        }
      })
    )
  }, [marketingNotificationPreferenceAtom, t])

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title={t('notifications.preferences.screenTitle')}
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
    >
      <YStack flex={1} paddingHorizontal="$3" paddingTop="$4">
        <YStack gap="$5">
          {pipe(
            contents,
            Array.map((one) => (
              <PreferenceCard
                key={one.id}
                atom={one.atom}
                description={one.description}
                title={one.title}
              />
            ))
          )}
        </YStack>
      </YStack>
    </Screen>
  )
}

export default NotificationSettingsScreen

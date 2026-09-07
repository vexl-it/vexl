import {Effect, Option, pipe} from 'effect'
import {PermissionStatus} from 'expo'
import {getPermissionsAsync} from 'expo-notifications'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import NotificationSetting from 'react-native-open-notification'
import {dismissEnableNotificationsInMarketplaceSuggestionActionAtom} from '../../../../../state/marketplace/atoms/offerSuggestionVisible'
import {checkAreNotificationsEnabledAtom} from '../../../../../state/notifications/areNotificationsEnabledAtom'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../../../utils/notifications/checkAndAskForPermissionsActionAtom'

function openNotificationSettings(): void {
  NotificationSetting.open()
}

function areNotificationsEnabled(
  status: Option.Option<{
    readonly notifications: boolean
  }>
): boolean {
  return Option.isSome(status) && status.value.notifications
}

const getNotificationSettingsOrUndefined = Effect.tryPromise({
  try: async () => await getPermissionsAsync(),
  catch: () => undefined,
}).pipe(Effect.catch(() => Effect.succeed(undefined)))

export default function useEnableNotificationsFromMarketplaceAction(): () => void {
  const checkAndAskForNotificationPermissions = useSetAtom(
    checkNotificationPermissionsAndAskIfPossibleActionAtom
  )
  const checkAreNotificationsEnabled = useSetAtom(
    checkAreNotificationsEnabledAtom
  )
  const dismissEnableNotificationsSuggestion = useSetAtom(
    dismissEnableNotificationsInMarketplaceSuggestionActionAtom
  )

  return useCallback(() => {
    Effect.runFork(
      Effect.gen(function* () {
        const settings = yield* getNotificationSettingsOrUndefined

        if (settings?.status === PermissionStatus.DENIED) {
          openNotificationSettings()
          const status = yield* checkAreNotificationsEnabled()
          if (areNotificationsEnabled(status)) {
            dismissEnableNotificationsSuggestion()
          }
          return
        }

        yield* pipe(
          checkAndAskForNotificationPermissions({force: true}),
          Effect.catch(() => Effect.void)
        )

        const status = yield* checkAreNotificationsEnabled()

        if (areNotificationsEnabled(status)) {
          dismissEnableNotificationsSuggestion()
        } else {
          openNotificationSettings()
        }
      })
    )
  }, [
    checkAndAskForNotificationPermissions,
    checkAreNotificationsEnabled,
    dismissEnableNotificationsSuggestion,
  ])
}

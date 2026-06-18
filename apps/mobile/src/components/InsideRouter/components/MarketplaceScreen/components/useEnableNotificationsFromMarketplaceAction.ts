import {Effect} from 'effect'
import {PermissionStatus} from 'expo'
import {getPermissionsAsync} from 'expo-notifications'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import NotificationSetting from 'react-native-open-notification'
import {checkAreNotificationsEnabledAtom} from '../../../../../state/notifications/areNotificationsEnabledAtom'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../../../utils/notifications/checkAndAskForPermissionsActionAtom'

function openNotificationSettings(): void {
  NotificationSetting.open()
}

const getNotificationSettingsOrUndefined = Effect.tryPromise({
  try: async () => await getPermissionsAsync(),
  catch: () => undefined,
}).pipe(Effect.catchAll(() => Effect.succeed(undefined)))

export default function useEnableNotificationsFromMarketplaceAction(): () => void {
  const checkAndAskForNotificationPermissions = useSetAtom(
    checkNotificationPermissionsAndAskIfPossibleActionAtom
  )
  const checkAreNotificationsEnabled = useSetAtom(
    checkAreNotificationsEnabledAtom
  )

  return useCallback(() => {
    Effect.runFork(
      Effect.gen(function* (_) {
        const settings = yield* _(getNotificationSettingsOrUndefined)

        if (settings?.status === PermissionStatus.DENIED) {
          openNotificationSettings()
          yield* _(checkAreNotificationsEnabled())
          return
        }

        yield* _(
          checkAndAskForNotificationPermissions({force: true}),
          Effect.catchAll(() => Effect.void)
        )

        const updatedSettings = yield* _(getNotificationSettingsOrUndefined)

        if (updatedSettings?.status !== PermissionStatus.GRANTED) {
          openNotificationSettings()
        }

        yield* _(checkAreNotificationsEnabled())
      })
    )
  }, [checkAndAskForNotificationPermissions, checkAreNotificationsEnabled])
}

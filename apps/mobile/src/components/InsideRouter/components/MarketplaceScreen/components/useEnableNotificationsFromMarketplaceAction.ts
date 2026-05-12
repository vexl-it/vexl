import notifee, {AuthorizationStatus} from '@notifee/react-native'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Platform} from 'react-native'
import NotificationSetting from 'react-native-open-notification'
import {checkAreNotificationsEnabledAtom} from '../../../../../state/notifications/areNotificationsEnabledAtom'
import checkNotificationPermissionsAndAskIfPossibleActionAtom from '../../../../../utils/notifications/checkAndAskForPermissionsActionAtom'

function openNotificationSettings(): void {
  if (Platform.OS === 'ios') {
    NotificationSetting.open()
    return
  }

  void notifee.openNotificationSettings()
}

const getNotificationSettingsOrUndefined = Effect.tryPromise({
  try: async () => await notifee.getNotificationSettings(),
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

        if (settings?.authorizationStatus === AuthorizationStatus.DENIED) {
          openNotificationSettings()
          yield* _(checkAreNotificationsEnabled())
          return
        }

        yield* _(
          checkAndAskForNotificationPermissions({force: true}),
          Effect.catchAll(() => Effect.void)
        )

        const updatedSettings = yield* _(getNotificationSettingsOrUndefined)

        if (
          updatedSettings?.authorizationStatus !==
          AuthorizationStatus.AUTHORIZED
        ) {
          openNotificationSettings()
        }

        yield* _(checkAreNotificationsEnabled())
      })
    )
  }, [checkAndAskForNotificationPermissions, checkAreNotificationsEnabled])
}

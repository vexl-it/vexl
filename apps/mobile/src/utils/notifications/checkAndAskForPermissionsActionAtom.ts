import notifee, {AuthorizationStatus} from '@notifee/react-native'
import {
  UnixMilliseconds0,
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import {atom, getDefaultStore, type Getter, type Setter} from 'jotai'
import {Alert, Platform} from 'react-native'
import NotificationSetting from 'react-native-open-notification'
import {toastNotificationAtom} from '../../components/ToastNotification/atom'
import {translationAtom} from '../localization/I18nProvider'
import {askAreYouSureActionAtom} from './../../components/AreYouSureDialog'
import {areNotificationsEnabledAtom} from './areNotificaitonsEnabledAtom'

const ALLOW_ASKING_EVERY_MILLIS = 10 * 60 * 1000

const isPermissionsGranted = Effect.promise(() =>
  notifee.getNotificationSettings()
)

export const requestPermissions = Effect.promise(() =>
  notifee.requestPermission()
).pipe(
  Effect.tap((e) => {
    getDefaultStore().set(
      areNotificationsEnabledAtom,
      e.authorizationStatus === AuthorizationStatus.AUTHORIZED
    )
  }),
  Effect.filterOrFail(
    (e) => e.authorizationStatus === AuthorizationStatus.AUTHORIZED,
    () => ({_tag: 'UserDeclined'}) as const
  )
)

const lastTimeNotificationsAskedAtom = atom<UnixMilliseconds>(UnixMilliseconds0)

const shouldAskForNotifications = (get: Getter): Effect.Effect<boolean> =>
  Effect.sync(
    () =>
      unixMillisecondsNow() - get(lastTimeNotificationsAskedAtom) >
      ALLOW_ASKING_EVERY_MILLIS
  )

const setAskedForNotificationsNow = (set: Setter): Effect.Effect<void> =>
  Effect.sync(() => {
    set(lastTimeNotificationsAskedAtom, unixMillisecondsNow())
  })

const openSettings =
  Platform.OS === 'ios'
    ? Effect.sync(() => {
        NotificationSetting.open()
      })
    : Effect.promise(() => notifee.openNotificationSettings())

const checkNotificationPermissionsAndAskIfPossibleActionAtom = atom(
  null,
  (get, set, {force}: {force: boolean} = {force: false}) =>
    Effect.gen(function* (_) {
      const {authorizationStatus} = yield* _(isPermissionsGranted)

      if (authorizationStatus === AuthorizationStatus.AUTHORIZED) {
        return 'granted' as const
      }

      if (!force && !(yield* _(shouldAskForNotifications(get)))) {
        return 'not-asked' as const
      }
      yield* _(setAskedForNotificationsNow(set))

      const {t} = get(translationAtom)

      const descriptionText = `⚠️ ${t(
        'notificationPrompt.explanation1.description1'
      )}\n\n${t('notificationPrompt.explanation1.description2')}`

      const showDialog = set(askAreYouSureActionAtom, {
        variant: 'info',
        makeSureOnDeny: true,
        steps: [
          {
            type: 'StepWithText',
            title: t('notificationPrompt.explanation1.title'),
            description: descriptionText,
            positiveButtonText: t(
              'notificationPrompt.explanation1.positiveButton'
            ),
            negativeButtonText: t(
              'notificationPrompt.explanation1.negativeButton'
            ),
          },
          {
            type: 'StepWithText',
            title: t('notificationPrompt.explanation2.title'),
            description: t('notificationPrompt.explanation2.description'),
            positiveButtonText: t(
              'notificationPrompt.explanation2.positiveButton'
            ),
            negativeButtonText: t(
              'notificationPrompt.explanation2.negativeButton'
            ),
          },
        ],
      })

      if (
        authorizationStatus === AuthorizationStatus.NOT_DETERMINED ||
        authorizationStatus === AuthorizationStatus.DENIED
      ) {
        return yield* _(
          showDialog,
          Effect.flatMap(() => requestPermissions),
          Effect.catchTag('UserDeclined', () =>
            Effect.zipRight(
              Effect.sync(() => {
                Alert.alert(
                  t('notificationPrompt.errorAlert.title'),
                  t('notificationPrompt.errorAlert.description'),
                  [
                    {
                      text: t('common.cancel'),
                      style: 'cancel',
                    },
                    {
                      text: 'Open settings',
                      onPress: () => openSettings,
                    },
                  ]
                )
              }),
              Effect.fail('not-granted' as const)
            )
          ),
          Effect.flatMap(() =>
            Effect.sync(() => {
              set(toastNotificationAtom, {
                visible: true,
                text: t('notificationPrompt.successMessage'),
              })
            })
          ),
          Effect.zipRight(Effect.succeed('asked' as const))
        )
      }
    }).pipe(
      Effect.flatMap((v) => {
        if (v === 'asked') {
          return Effect.fail({_tag: 'NotificationPrompted'} as const)
        }
        return Effect.void
      }),
      Effect.catchAll(() =>
        Effect.fail({_tag: 'NotificationPrompted'} as const)
      )
    )
)
export const checkNotificationPermissionsAndAskIfPossibleTEActionAtom = atom(
  null,
  (get, set) =>
    set(checkNotificationPermissionsAndAskIfPossibleActionAtom).pipe(
      effectToTaskEither
    )
)

export default checkNotificationPermissionsAndAskIfPossibleActionAtom

import {
  UnixMilliseconds0,
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import {PermissionStatus} from 'expo'
import {getPermissionsAsync, requestPermissionsAsync} from 'expo-notifications'
import {atom, getDefaultStore, type Getter, type Setter} from 'jotai'
import {Alert} from 'react-native'
import NotificationSetting from 'react-native-open-notification'
import {toastNotificationAtom} from '../../components/ToastNotification/atom'
import {translationAtom} from '../localization/I18nProvider'
import {askAreYouSureActionAtom} from './../../components/GlobalDialog'
import {areNotificationsEnabledAtom} from './areNotificaitonsEnabledAtom'

const ALLOW_ASKING_EVERY_MILLIS = 10 * 60 * 1000

const notificationSettings = Effect.promise(() => getPermissionsAsync())

export const requestPermissions = Effect.promise(() =>
  requestPermissionsAsync()
).pipe(
  Effect.tap((e) => {
    getDefaultStore().set(areNotificationsEnabledAtom, e.granted)
  }),
  Effect.filterOrFail(
    (e) => e.granted,
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

const openSettings = Effect.sync(() => {
  NotificationSetting.open()
})

const checkNotificationPermissionsAndAskIfPossibleActionAtom = atom(
  null,
  (get, set, {force}: {force: boolean} = {force: false}) =>
    Effect.gen(function* (_) {
      const {status} = yield* _(notificationSettings)

      if (status === PermissionStatus.GRANTED) {
        return 'granted' as const
      }

      if (!force && !(yield* _(shouldAskForNotifications(get)))) {
        return 'not-asked' as const
      }
      yield* _(setAskedForNotificationsNow(set))

      const {t} = get(translationAtom)

      const explanationDescription1 = t(
        'notificationPrompt.explanation1.description1'
      )
      const explanationDescription2 = t(
        'notificationPrompt.explanation1.description2'
      ).trim()
      const descriptionText =
        explanationDescription2.length > 0
          ? `${explanationDescription1}\n\n${explanationDescription2}`
          : explanationDescription1

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
        status === PermissionStatus.UNDETERMINED ||
        status === PermissionStatus.DENIED
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
              set(toastNotificationAtom, t('notificationPrompt.successMessage'))
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

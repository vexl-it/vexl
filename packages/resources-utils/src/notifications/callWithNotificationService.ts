import {type FcmCypher} from '@vexl-next/domain/src/general/notifications'
import * as SemverString from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type NotificationPrivateApi} from '@vexl-next/rest-api/src/services/notification'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import reportErrorFromResourcesUtils from '../reportErrorFromResourcesUtils'

const FE_VERSION_SUPPORTING_V2_NOTIFICATIONS =
  SemverString.SemverString.parse('1.17.0')

interface NotificationArgs {
  otherSideVersion?: SemverString.SemverString | undefined
  fcmCypher?: FcmCypher | undefined
  notificationApi: NotificationPrivateApi
}

export function callWithNotificationService<
  T extends {notificationServiceReady: boolean} & object,
  L,
  R extends {notificationHandled: boolean},
>(
  f: (arg: T) => TE.TaskEither<L, R>,
  fArgs: Omit<T, 'notificationServiceReady'>
): (args: NotificationArgs) => TE.TaskEither<L, R> {
  return ({notificationApi, fcmCypher, otherSideVersion}) => {
    // Do not try to issue notification if there is no fcmCypher or the other side does not support V2 notifications
    if (
      !fcmCypher ||
      !otherSideVersion ||
      SemverString.compare(otherSideVersion)(
        '<',
        FE_VERSION_SUPPORTING_V2_NOTIFICATIONS
      )
    ) {
      return f({...(fArgs as T), notificationServiceReady: false})
    }
    return pipe(
      f({...(fArgs as T), notificationServiceReady: true}),
      TE.chainW((result) => {
        if (result.notificationHandled) {
          return TE.right(result)
        }

        return pipe(
          notificationApi.issueNotification({
            fcmCypher,
          }),
          TE.match(
            (e) => {
              reportErrorFromResourcesUtils(
                'warn',
                new Error('Error issuing notificiation'),
                {e}
              )
              return E.right(result)
            },
            () => {
              return E.right(result)
            }
          )
        )
      })
    )
  }
}

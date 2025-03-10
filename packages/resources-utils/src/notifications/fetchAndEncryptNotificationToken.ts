import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  type NetworkError,
  type NotFoundError,
  type UnauthorizedError,
  type UnknownClientError,
  type UnknownServerError,
} from '@vexl-next/rest-api/src/Errors'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect} from 'effect'
import {ecnryptNotificationToken} from './notificationTokenActions'

export function fetchAndEncryptNotificationToken({
  expoToken,
  notificationApi,
  locale,
}: {
  expoToken: ExpoNotificationToken
  notificationApi: NotificationApi
  locale: string
}): Effect.Effect<
  NotificationCypher,
  | NetworkError
  | NotFoundError
  | UnknownClientError
  | UnknownServerError
  | UnauthorizedError
  | CryptoError,
  never
> {
  return Effect.gen(function* (_) {
    const {publicKey} = yield* _(notificationApi.getNotificationPublicKey())
    return yield* _(
      ecnryptNotificationToken({
        serverPublicKey: publicKey,
        notificationToken: expoToken,
        locale,
      })
    )
  })
}

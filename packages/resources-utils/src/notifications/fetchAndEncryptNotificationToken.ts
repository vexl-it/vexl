import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type PlatformName} from '@vexl-next/rest-api'
import {
  type NetworkError,
  type NotFoundError,
  type UnauthorizedError,
  type UnknownClientError,
  type UnknownServerError,
} from '@vexl-next/rest-api/src/Errors'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {ecnryptNotificationToken} from './notificationTokenActions'

export function fetchAndEncryptNotificationToken({
  expoToken,
  notificationApi,
  clientVersion,
  clientPlatform,
  locale,
}: {
  expoToken: ExpoNotificationToken
  notificationApi: NotificationApi
  clientVersion: VersionCode
  clientPlatform: PlatformName
  locale: string
}): Effect.Effect<
  NotificationCypher,
  | NetworkError
  | NotFoundError
  | UnknownClientError
  | UnknownServerError
  | UnauthorizedError
  | ParseError
  | CryptoError,
  never
> {
  return Effect.gen(function* (_) {
    const {publicKey} = yield* _(notificationApi.getNotificationPublicKey())
    return yield* _(
      ecnryptNotificationToken({
        serverPublicKey: publicKey,
        clientPlatform,
        clientVersion,
        notificationToken: expoToken,
        locale,
      })
    )
  })
}

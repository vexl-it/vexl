import {
  type NotFoundError,
  type RateLimitedError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type PlatformName} from '@vexl-next/rest-api'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {type HttpClientError} from 'effect/unstable/http'
import {type HttpApiSchemaError} from 'effect/unstable/httpapi/HttpApiError'
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
  | HttpApiSchemaError
  | NotFoundError
  | UnexpectedServerError
  | RateLimitedError
  | HttpClientError.HttpClientError
  | SchemaError
  | CryptoError,
  never
> {
  return Effect.gen(function* () {
    const {publicKey} = yield* notificationApi.getNotificationPublicKey()
    return yield* ecnryptNotificationToken({
      serverPublicKey: publicKey,
      clientPlatform,
      clientVersion,
      notificationToken: expoToken,
      locale,
    })
  })
}

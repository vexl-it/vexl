import {eciesLegacy} from '@vexl-next/cryptography/src/index'
import {type FcmCypher} from '@vexl-next/domain/src/general/notifications'
import {NotificationCypherE} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  FcmTokenE,
  type FcmToken,
} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {extractPartsOfNotificationCypher} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {InvalidFcmCypherError} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect, Schema, type ConfigError} from 'effect'
import {fcmTokenPrivateKeyConfig} from '../../configs'

export function decodeFcmCypher(
  fcmCypher: FcmCypher
): Effect.Effect<FcmToken, InvalidFcmCypherError | ConfigError.ConfigError> {
  return Effect.gen(function* (_) {
    const privateKey = yield* _(fcmTokenPrivateKeyConfig)
    const notificationCypher = Schema.decodeSync(NotificationCypherE)(fcmCypher)
    const data = yield* _(
      extractPartsOfNotificationCypher({notificationCypher}),
      Effect.catchTag(
        'NoSuchElementException',
        () => new InvalidFcmCypherError()
      )
    )

    // TODO we can check if the cypher is meant for our public key

    return yield* _(
      Effect.tryPromise({
        try: async () =>
          await eciesLegacy.eciesLegacyDecrypt({data: data.cypher, privateKey}),
        catch: () => {
          return new InvalidFcmCypherError()
        },
      }),
      Effect.flatMap(Schema.decode(FcmTokenE)),
      Effect.catchTag('ParseError', () => {
        return new InvalidFcmCypherError()
      })
    )
  })
}

import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  isVexlNotificationToken,
  type VexlNotificationToken,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  decryptNotificationToken,
  extractPartsOfNotificationCypher,
} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {type PlatformName} from '@vexl-next/rest-api'
import {type InvalidFcmCypherError} from '@vexl-next/rest-api/src/services/notification/contract'
import {type NoSuchElementException} from 'effect/Cause'
import {Context, Effect, Layer} from 'effect/index'
import {fcmTokenPrivateKeyConfig} from '../../configs'
import {NotificationTokensDb} from '../NotificationTokensDb'
import {
  createTemporaryVexlNotificationToken,
  getExpoTokenFromTemporaryVexlNotificationToken,
} from './utils'

export interface VexlNotificationTokenServiceOperations {
  createTemporaryVexlNotificationToken: (
    expoToken: ExpoNotificationToken
  ) => VexlNotificationToken

  getExpoToken: (
    // TODO #2124 - remove types for decrypting token
    vexlTokenOrCypher: VexlNotificationToken | NotificationCypher
  ) => Effect.Effect<
    ExpoNotificationToken,
    | NoSuchElementException
    | UnexpectedServerError
    // TODO #2124 - remove types for decrypting token
    | CryptoError
    | InvalidFcmCypherError
  >
  normalizeToExpoToken: (
    tokenOrCypher: VexlNotificationToken | NotificationCypher
  ) => Effect.Effect<
    VexlNotificationToken,
    | NoSuchElementException
    | UnexpectedServerError
    | CryptoError
    | InvalidFcmCypherError,
    VexlNotificationTokenService
  >
  getMetadata: (
    tokenOrCypher: VexlNotificationToken | NotificationCypher
  ) => Effect.Effect<
    {
      locale: string
      clientVersion: VersionCode
      clientPlatform: PlatformName
    },
    NoSuchElementException | UnexpectedServerError,
    never
  >
}

export class VexlNotificationTokenService extends Context.Tag(
  'VexlNotificationTokenService'
)<VexlNotificationTokenService, VexlNotificationTokenServiceOperations>() {
  static Live = Layer.effect(
    VexlNotificationTokenService,
    Effect.gen(function* (_) {
      const privateKey = yield* _(fcmTokenPrivateKeyConfig)
      const tokenDb = yield* _(NotificationTokensDb)

      return {
        normalizeToExpoToken: (tokenOrCypher) =>
          Effect.gen(function* (_) {
            if (isVexlNotificationToken(tokenOrCypher)) {
              return tokenOrCypher
            }

            const expoToken = yield* _(
              decryptNotificationToken({
                privateKey,
                notificationCypher: tokenOrCypher,
              }),
              Effect.map((r) => r.expoToken)
            )

            return createTemporaryVexlNotificationToken(expoToken)
          }),
        createTemporaryVexlNotificationToken,
        getMetadata: (tokenOrCypher) =>
          Effect.gen(function* (_) {
            if (isVexlNotificationToken(tokenOrCypher)) {
              const data = yield* _(
                tokenDb.findSecretByNotificationToken(tokenOrCypher),
                Effect.flatten
              )
              return {
                locale: data.clientLanguage,
                clientVersion: data.clientVersion,
                clientPlatform: data.clientPlatform,
              }
            }

            const parts = yield* _(
              extractPartsOfNotificationCypher({
                notificationCypher: tokenOrCypher,
              })
            )

            return {
              locale: parts.data.locale,
              clientVersion: parts.data.clientVersion,
              clientPlatform: parts.data.clientPlatform,
            }
          }),
        getExpoToken: (vexlTokenOrCypher) =>
          Effect.gen(function* (_) {
            if (isVexlNotificationToken(vexlTokenOrCypher)) {
              return yield* _(
                getExpoTokenFromTemporaryVexlNotificationToken(
                  vexlTokenOrCypher
                ),
                Effect.catchTag('NoSuchElementException', () =>
                  tokenDb.findSecretByNotificationToken(vexlTokenOrCypher).pipe(
                    Effect.flatten,
                    Effect.flatMap((r) =>
                      Effect.fromNullable(r.expoNotificationToken)
                    )
                  )
                )
              )
            } else {
              return yield* _(
                decryptNotificationToken({
                  notificationCypher: vexlTokenOrCypher,
                  privateKey,
                }),
                Effect.map((r) => r.expoToken)
              )
            }
          }),
      }
    })
  )
}

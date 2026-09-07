import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  isVexlNotificationToken,
  isVexlNotificationTokenSecret,
  type VexlNotificationToken,
  type VexlNotificationTokenSecret,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  isExpoNotificationToken,
  type ExpoNotificationToken,
} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  decryptNotificationToken,
  extractPartsOfNotificationCypher,
} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {type PlatformName} from '@vexl-next/rest-api'
import {Context, Effect, Layer, pipe} from 'effect'
import {NoSuchElementError} from 'effect/Cause'
import {fcmTokenPrivateKeyConfig} from '../../configs'
import {NotificationTokensDb} from '../NotificationTokensDb'
import {
  createTemporaryVexlNotificationTokenSecret,
  getExpoTokenFromTemporaryVexlNotificationToken,
} from './utils'

export interface VexlNotificationTokenServiceOperations {
  getExpoToken: (
    vexlTokenOrCypher: VexlNotificationTokenSecret | NotificationCypher
  ) => Effect.Effect<
    ExpoNotificationToken,
    NoSuchElementError | UnexpectedServerError
  >

  normalizeToVexlNotificationTokenSecret: (
    tokenOrCypher:
      | VexlNotificationToken
      | NotificationCypher
      | ExpoNotificationToken
  ) => Effect.Effect<
    VexlNotificationTokenSecret,
    NoSuchElementError | UnexpectedServerError,
    never
  >

  getMetadata: (
    tokenOrCypher:
      | VexlNotificationTokenSecret
      | NotificationCypher
      | VexlNotificationToken
  ) => Effect.Effect<
    {
      locale: string
      clientVersion: VersionCode
      clientPlatform: PlatformName
    },
    NoSuchElementError | UnexpectedServerError,
    never
  >
}

export class VexlNotificationTokenService extends Context.Service<
  VexlNotificationTokenService,
  VexlNotificationTokenServiceOperations
>()('VexlNotificationTokenService') {
  static Live = Layer.effect(
    VexlNotificationTokenService,
    Effect.gen(function* () {
      const privateKey = yield* fcmTokenPrivateKeyConfig
      const tokenDb = yield* NotificationTokensDb

      return {
        normalizeToVexlNotificationTokenSecret: (tokenOrCypher) =>
          Effect.gen(function* () {
            if (isVexlNotificationToken(tokenOrCypher)) {
              return yield* pipe(
                tokenDb.findSecretByNotificationToken(tokenOrCypher),
                Effect.flatMap(Effect.fromOption),
                Effect.map((one) => one.secret)
              )
            }

            if (isExpoNotificationToken(tokenOrCypher)) {
              return createTemporaryVexlNotificationTokenSecret(tokenOrCypher)
            }

            return yield* pipe(
              decryptNotificationToken({
                notificationCypher: tokenOrCypher,
                privateKey,
              }),
              Effect.map((r) =>
                createTemporaryVexlNotificationTokenSecret(r.expoToken)
              ),
              Effect.catch((e) => new NoSuchElementError())
            )
          }),
        getMetadata: (tokenOrCypher) =>
          Effect.gen(function* () {
            if (isVexlNotificationTokenSecret(tokenOrCypher)) {
              const data = yield* pipe(
                tokenDb.findSecretBySecretValue(tokenOrCypher),
                Effect.flatMap(Effect.fromOption)
              )
              return {
                locale: data.clientLanguage,
                clientVersion: data.clientVersion,
                clientPlatform: data.clientPlatform,
              }
            }

            if (isVexlNotificationToken(tokenOrCypher)) {
              const data = yield* pipe(
                tokenDb.findSecretByNotificationToken(tokenOrCypher),
                Effect.flatMap(Effect.fromOption)
              )
              return {
                locale: data.clientLanguage,
                clientVersion: data.clientVersion,
                clientPlatform: data.clientPlatform,
              }
            }

            const parts = yield* Effect.fromOption(
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
          Effect.gen(function* () {
            if (isVexlNotificationTokenSecret(vexlTokenOrCypher)) {
              return yield* pipe(
                Effect.fromOption(
                  getExpoTokenFromTemporaryVexlNotificationToken(
                    vexlTokenOrCypher
                  )
                ),
                Effect.catchTag('NoSuchElementError', () =>
                  tokenDb.findSecretBySecretValue(vexlTokenOrCypher).pipe(
                    Effect.flatMap(Effect.fromOption),
                    Effect.flatMap((r) =>
                      Effect.fromNullishOr(r.expoNotificationToken)
                    )
                  )
                )
              )
            } else {
              return yield* pipe(
                decryptNotificationToken({
                  notificationCypher: vexlTokenOrCypher,
                  privateKey,
                }).pipe(
                  Effect.catch(
                    (e) =>
                      new UnexpectedServerError({
                        message: 'Failed to decrypt notification token',
                        cause: e,
                      })
                  )
                ),
                Effect.map((r) => r.expoToken)
              )
            }
          }),
      }
    })
  )
}

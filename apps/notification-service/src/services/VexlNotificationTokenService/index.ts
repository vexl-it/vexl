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
import {NoSuchElementException} from 'effect/Cause'
import {Context, Effect, Layer} from 'effect/index'
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
    NoSuchElementException | UnexpectedServerError
  >

  normalizeToVexlNotificationTokenSecret: (
    tokenOrCypher:
      | VexlNotificationToken
      | NotificationCypher
      | ExpoNotificationToken
  ) => Effect.Effect<
    VexlNotificationTokenSecret,
    NoSuchElementException | UnexpectedServerError,
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
        normalizeToVexlNotificationTokenSecret: (tokenOrCypher) =>
          Effect.gen(function* (_) {
            if (isVexlNotificationToken(tokenOrCypher)) {
              return yield* _(
                tokenDb.findSecretByNotificationToken(tokenOrCypher),
                Effect.flatten,
                Effect.map((one) => one.secret)
              )
            }

            if (isExpoNotificationToken(tokenOrCypher)) {
              return createTemporaryVexlNotificationTokenSecret(tokenOrCypher)
            }

            return yield* _(
              decryptNotificationToken({
                notificationCypher: tokenOrCypher,
                privateKey,
              }),
              Effect.map((r) =>
                createTemporaryVexlNotificationTokenSecret(r.expoToken)
              ),
              Effect.catchAll((e) => new NoSuchElementException())
            )
          }),
        getMetadata: (tokenOrCypher) =>
          Effect.gen(function* (_) {
            if (isVexlNotificationTokenSecret(tokenOrCypher)) {
              const data = yield* _(
                tokenDb.findSecretBySecretValue(tokenOrCypher),
                Effect.flatten
              )
              return {
                locale: data.clientLanguage,
                clientVersion: data.clientVersion,
                clientPlatform: data.clientPlatform,
              }
            }

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
            if (isVexlNotificationTokenSecret(vexlTokenOrCypher)) {
              return yield* _(
                getExpoTokenFromTemporaryVexlNotificationToken(
                  vexlTokenOrCypher
                ),
                Effect.catchTag('NoSuchElementException', () =>
                  tokenDb.findSecretBySecretValue(vexlTokenOrCypher).pipe(
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
                }).pipe(
                  Effect.catchAll(
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

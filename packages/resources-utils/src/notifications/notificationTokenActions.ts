import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type NotificationCypher,
  NotificationCypherE,
} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  type ExpoNotificationToken,
  ExpoNotificationTokenE,
} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  type CryptoError,
  eciesGTMDecryptE,
  EciesGTMECypher,
  eciesGTMEncryptE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {PlatformName} from '@vexl-next/rest-api'
import {InvalidFcmCypherError} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect, Option, pipe, Schema, String} from 'effect'
import {type ParseError} from 'effect/ParseResult'

const EXPO_V2_CYPHER_PREFIX = 'EXPO_V2'

const ExpoV2CypherPayload = Schema.compose(
  Schema.StringFromBase64,
  Schema.parseJson(
    Schema.Struct({
      locale: Schema.String,
      notificationTokenEncrypted: EciesGTMECypher,
      clientVersion: VersionCode,
      clientPlatform: PlatformName,
      serverPublicKey: PublicKeyPemBase64E,
    })
  )
)
export type ExpoV2CypherPayload = typeof ExpoV2CypherPayload.Type

export function ecnryptNotificationToken({
  locale,
  notificationToken,
  clientVersion,
  clientPlatform,
  serverPublicKey,
}: {
  locale: string
  notificationToken: ExpoNotificationToken
  clientVersion: VersionCode
  clientPlatform: PlatformName
  serverPublicKey: PublicKeyPemBase64
}): Effect.Effect<NotificationCypher, CryptoError | ParseError> {
  return Effect.gen(function* (_) {
    const encryptedToken = yield* _(
      eciesGTMEncryptE(serverPublicKey)(notificationToken)
    )

    const dataToEncode: ExpoV2CypherPayload = {
      locale,
      notificationTokenEncrypted: encryptedToken,
      clientVersion,
      clientPlatform,
      serverPublicKey,
    }

    return yield* _(
      Schema.encode(ExpoV2CypherPayload)(dataToEncode),
      Effect.map((one) => `${EXPO_V2_CYPHER_PREFIX}.${one}`),
      Effect.flatMap(Schema.decode(NotificationCypherE))
    )
  })
}

export function extractPartsOfNotificationCypher({
  notificationCypher,
}: {
  notificationCypher: NotificationCypher
}): Option.Option<{type: 'expoV2'; data: ExpoV2CypherPayload}> {
  return pipe(
    Option.some(notificationCypher),
    Option.filter(String.startsWith(EXPO_V2_CYPHER_PREFIX)),
    Option.map(String.replace(`${EXPO_V2_CYPHER_PREFIX}.`, '')),
    Option.flatMap(Schema.decodeOption(ExpoV2CypherPayload)),
    Option.map((data) => ({
      type: 'expoV2' as const,
      data,
    }))
  )
}

interface DecodeResult {
  type: 'expoV2'
  data: ExpoV2CypherPayload
  expoToken: ExpoNotificationToken
}
export const decryptNotificationToken = ({
  privateKey,
  notificationCypher,
}: {
  privateKey: PrivateKeyPemBase64
  notificationCypher: NotificationCypher
}): Effect.Effect<DecodeResult, CryptoError | InvalidFcmCypherError> =>
  Effect.gen(function* (_) {
    const parts = yield* _(
      extractPartsOfNotificationCypher({
        notificationCypher,
      }),
      Effect.catchTag(
        'NoSuchElementException',
        () => new InvalidFcmCypherError()
      )
    )

    const {data} = parts
    const decryptedToken = yield* _(
      eciesGTMDecryptE(privateKey)(data.notificationTokenEncrypted),
      Effect.flatMap(Schema.decode(ExpoNotificationTokenE)),
      Effect.catchTag('ParseError', () => new InvalidFcmCypherError())
    )

    return {
      type: 'expoV2' as const,
      data,
      expoToken: decryptedToken,
    }
  })

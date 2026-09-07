import {
  PublicKeyPemBase64,
  type PrivateKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  eciesGTMDecryptE,
  EciesGTMECypher,
  eciesGTMEncryptE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidFcmCypherError} from '@vexl-next/rest-api/src/services/notification/contract'
import {Effect, Option, pipe, Schema, String} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {type NotificationTokenOrCypher} from './callWithNotificationService'

const EXPO_V2_CYPHER_PREFIX = 'EXPO_V2'

const ExpoV2CypherPayload = Schema.StringFromBase64.pipe(
  Schema.decodeTo(
    Schema.fromJsonString(
      Schema.Struct({
        locale: Schema.String,
        notificationTokenEncrypted: EciesGTMECypher,
        clientVersion: VersionCode,
        clientPlatform: PlatformName,
        serverPublicKey: PublicKeyPemBase64,
      })
    )
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
}): Effect.Effect<NotificationCypher, CryptoError | SchemaError> {
  return Effect.gen(function* () {
    const encryptedToken =
      yield* eciesGTMEncryptE(serverPublicKey)(notificationToken)

    const dataToEncode: ExpoV2CypherPayload = {
      locale,
      notificationTokenEncrypted: encryptedToken,
      clientVersion,
      clientPlatform,
      serverPublicKey,
    }

    return yield* pipe(
      Schema.encodeEffect(ExpoV2CypherPayload)(dataToEncode),
      Effect.map((one) => `${EXPO_V2_CYPHER_PREFIX}.${one}`),
      Effect.flatMap(Schema.decodeEffect(NotificationCypher))
    )
  })
}

export interface ExtractedNotificationParts {
  type: 'expoV2'
  data: ExpoV2CypherPayload
}

export function extractPartsOfNotificationCypher({
  notificationCypher,
}: {
  notificationCypher: NotificationTokenOrCypher
}): Option.Option<ExtractedNotificationParts> {
  // Otherwise try to parse as encrypted cypher
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
  Effect.gen(function* () {
    const parts = yield* Effect.fromOption(
      extractPartsOfNotificationCypher({notificationCypher}),
      () => new InvalidFcmCypherError()
    )

    const {data} = parts
    const decryptedToken = yield* pipe(
      eciesGTMDecryptE(privateKey)(data.notificationTokenEncrypted),
      Effect.flatMap(Schema.decodeEffect(ExpoNotificationToken)),
      Effect.catchTag('SchemaError', () => new InvalidFcmCypherError())
    )

    return {
      type: 'expoV2' as const,
      data,
      expoToken: decryptedToken,
    }
  })

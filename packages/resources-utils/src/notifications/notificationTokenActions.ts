import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder'
import {eciesLegacyDecrypt} from '@vexl-next/cryptography/src/operations/eciesLegacy'
import {
  type NotificationCypher,
  NotificationCypherE,
} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {
  type ExpoNotificationToken,
  ExpoNotificationTokenE,
} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {
  type FcmToken,
  FcmTokenE,
} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  CryptoError,
  eciesGTMDecryptE,
  EciesGTMECypher,
  eciesGTMEncryptE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {PlatformName} from '@vexl-next/rest-api'
import {InvalidFcmCypherError} from '@vexl-next/rest-api/src/services/notification/contract'
import {Array, Effect, Option, pipe, Schema, String} from 'effect'
import {type ParseError} from 'effect/ParseResult'

const EXPO_CYPHER_PREFIX = 'EXPO'
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
type ExpoV2CypherPayload = typeof ExpoV2CypherPayload.Type

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

function processPartsOfCypher({
  serverPublicKey,
  locale,
  restOfTheCypher,
}: {
  serverPublicKey: string | undefined
  locale?: string | undefined
  restOfTheCypher: string[]
}):
  | {
      serverPublicKey: PublicKeyPemBase64
      cypher: string
      locale: string | undefined
    }
  | undefined {
  if (!serverPublicKey || restOfTheCypher.length === 0) return undefined

  const decodedKey = Schema.decodeOption(PublicKeyPemBase64E)(serverPublicKey)
  if (Option.isNone(decodedKey)) return undefined

  return {
    locale,
    serverPublicKey: decodedKey.value,
    cypher: Array.join(restOfTheCypher, '.'),
  }
}

export function extractPartsOfNotificationCypher({
  notificationCypher,
}: {
  notificationCypher: NotificationCypher
}): Option.Option<
  | {type: 'expoV2'; data: ExpoV2CypherPayload}
  | {
      type: 'expo'
      serverPublicKey: PublicKeyPemBase64
      cypher: EciesGTMECypher
      locale: string
    }
  | {
      type: 'fcm'
      serverPublicKey: PublicKeyPemBase64
      cypher: string
    }
> {
  try {
    if (String.startsWith(EXPO_V2_CYPHER_PREFIX)(notificationCypher)) {
      return pipe(
        String.replace(`${EXPO_V2_CYPHER_PREFIX}.`, '')(notificationCypher),
        Schema.decodeOption(ExpoV2CypherPayload),
        Effect.map((data) => ({
          type: 'expoV2' as const,
          data,
        })),
        Effect.option,
        Effect.runSync
      )
    }

    if (String.startsWith(EXPO_CYPHER_PREFIX)(notificationCypher)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, locale, serverPublicKey, ...cypherParts] =
        String.split('.')(notificationCypher)
      const parts = processPartsOfCypher({
        serverPublicKey,
        locale,
        restOfTheCypher: cypherParts,
      })
      if (!parts?.locale) return Option.none()

      return Option.some({
        type: 'expo',
        serverPublicKey: parts.serverPublicKey,
        cypher: Schema.decodeSync(EciesGTMECypher)(parts.cypher),
        locale: parts.locale,
      })
    }

    const [serverPublicKey, ...cypherParts] =
      String.split('.')(notificationCypher)
    const parts = processPartsOfCypher({
      serverPublicKey,
      restOfTheCypher: cypherParts,
    })
    if (!parts) return Option.none()
    return Option.some({
      ...parts,
      type: 'fcm',
    })
  } catch (e) {
    return Option.none()
  }
}

type DecodeResult =
  | {
      type: 'expoV2'
      data: ExpoV2CypherPayload
      expoToken: ExpoNotificationToken
    }
  | {
      type: 'expo'
      expoToken: ExpoNotificationToken
      locale: string
    }
  | {
      type: 'fcm'
      fcmToken: FcmToken
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

    if (parts.type === 'expoV2') {
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
    }

    const {cypher, type} = parts

    if (type === 'expo') {
      return yield* _(
        eciesGTMDecryptE(privateKey)(cypher),
        Effect.map(Schema.decodeSync(ExpoNotificationTokenE)),
        Effect.map(
          (token) =>
            ({
              type: 'expo',
              expoToken: token,
              locale: parts.locale,
            }) satisfies DecodeResult
        )
      )
    }

    return yield* _(
      Effect.tryPromise({
        try: async () => await eciesLegacyDecrypt({privateKey, data: cypher}),
        catch: (e) =>
          new CryptoError({
            error: e,
            message: 'Error decrypting legacy cypher',
          }),
      }),
      Effect.map(Schema.decodeSync(FcmTokenE)),
      Effect.map(
        (token) => ({fcmToken: token, type: 'fcm'}) satisfies DecodeResult
      )
    )
  })

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
import {
  CryptoError,
  eciesGTMDecryptE,
  EciesGTMECypher,
  eciesGTMEncryptE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidFcmCypherError} from '@vexl-next/rest-api/src/services/notification/contract'
import {Array, Effect, Option, Schema, String} from 'effect'

const EXPO_CYPHER_PREFIX = 'EXPO'

export function ecnryptNotificationToken({
  locale,
  serverPublicKey,
  notificationToken,
}: {
  locale: string
  serverPublicKey: PublicKeyPemBase64
  notificationToken: ExpoNotificationToken
}): Effect.Effect<NotificationCypher, CryptoError> {
  return Effect.gen(function* (_) {
    const encryptedToken = yield* _(
      eciesGTMEncryptE(serverPublicKey)(notificationToken)
    )
    return Schema.decodeSync(NotificationCypherE)(
      `${EXPO_CYPHER_PREFIX}.${locale}.${serverPublicKey}.${encryptedToken}`
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

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
import {Array, Effect, Option, pipe, Schema, String} from 'effect'

const EXPO_CYPHER_PREFIX = 'EXPO.'

export function ecnryptNotificationToken({
  serverPublicKey,
  notificationToken,
}: {
  serverPublicKey: PublicKeyPemBase64
  notificationToken: ExpoNotificationToken
}): Effect.Effect<NotificationCypher, CryptoError> {
  return Effect.gen(function* (_) {
    const encryptedToken = yield* _(
      eciesGTMEncryptE(serverPublicKey)(notificationToken)
    )
    return Schema.decodeSync(NotificationCypherE)(
      `${EXPO_CYPHER_PREFIX}.${serverPublicKey}.${encryptedToken}`
    )
  })
}

function processPartsOfCypher({
  serverPublicKey,
  restOfTheCypher,
}: {
  serverPublicKey: string | undefined
  restOfTheCypher: string[]
}): {serverPublicKey: PublicKeyPemBase64; cypher: string} | undefined {
  if (!serverPublicKey || restOfTheCypher.length === 0) return undefined

  const decodedKey = Schema.decodeOption(PublicKeyPemBase64E)(serverPublicKey)
  if (Option.isNone(decodedKey)) return undefined

  return {
    serverPublicKey: decodedKey.value,
    cypher: Array.join(restOfTheCypher, '.'),
  }
}

export function extractPartsOfNotificationCypher({
  notificationCypher,
}: {
  notificationCypher: NotificationCypher
}): {serverPublicKey: PublicKeyPemBase64; cypher: string} | undefined {
  if (String.startsWith(EXPO_CYPHER_PREFIX)(notificationCypher)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, serverPublicKey, ...cypherParts] =
      String.split('.')(notificationCypher)
    return processPartsOfCypher({serverPublicKey, restOfTheCypher: cypherParts})
  }

  const [serverPublicKey, ...cypherParts] =
    String.split('.')(notificationCypher)
  return processPartsOfCypher({
    serverPublicKey,
    restOfTheCypher: cypherParts,
  })
}

type DecodeResult =
  | {
      type: 'expo'
      expoToken: ExpoNotificationToken
    }
  | {
      type: 'fcm'
      fcmToken: FcmToken
    }
export const decryptNotificationToken = ({
  privateKey,
  cypher,
}: {
  privateKey: PrivateKeyPemBase64
  cypher: NotificationCypher
}): Effect.Effect<DecodeResult, CryptoError | InvalidFcmCypherError> =>
  Effect.gen(function* (_) {
    if (String.startsWith(EXPO_CYPHER_PREFIX)(cypher)) {
      // IS expo token

      const cypherText = pipe(
        cypher,
        String.split('.'),
        Array.drop(2),
        Array.join('.'),
        Schema.decodeSync(EciesGTMECypher)
      )

      if (String.isEmpty(cypherText))
        return yield* _(new InvalidFcmCypherError())

      return yield* _(
        cypherText,
        eciesGTMDecryptE(privateKey),
        Effect.map(Schema.decodeSync(ExpoNotificationTokenE)),
        Effect.map(
          (token): DecodeResult => ({expoToken: token, type: 'expo' as const})
        )
      )
    }

    const cypherText = pipe(
      cypher,
      String.split('.'),
      Array.drop(1),
      Array.join('.')
    )

    if (String.isEmpty(cypherText)) return yield* _(new InvalidFcmCypherError())

    return yield* _(
      Effect.tryPromise({
        try: async () =>
          await eciesLegacyDecrypt({privateKey, data: cypherText}),
        catch: (e) =>
          new CryptoError({
            error: e,
            message: 'Error decrypting legacy cypher',
          }),
      }),
      Effect.map(Schema.decodeSync(FcmTokenE)),
      Effect.map(
        (token) =>
          ({fcmToken: token, type: 'fcm' as const}) satisfies DecodeResult
      )
    )
  })

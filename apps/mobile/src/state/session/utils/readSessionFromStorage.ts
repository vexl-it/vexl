import {
  aesDecrpytE,
  AesGtmCypher,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {taskEitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, Schema, type ParseResult} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {SessionE, type Session} from '../../../brands/Session.brand'
import {
  aesDecrypt,
  getItemFromAsyncStorage,
  getItemFromSecretStorage,
  type ErrorReadingFromAsyncStorage,
  type ErrorReadingFromSecureStorage,
  type StoreEmpty,
} from '../../../utils/fpUtils'

export default function readSessionFromStorage({
  asyncStorageKey,
  secretStorageKey,
}: {
  asyncStorageKey: string
  secretStorageKey: string
}): Effect.Effect<
  Session,
  | StoreEmpty
  | ErrorReadingFromSecureStorage
  | ErrorReadingFromAsyncStorage
  | CryptoError
  | ParseResult.ParseError
> {
  return Effect.gen(function* (_) {
    const encryptedSessionJson = yield* _(
      getItemFromAsyncStorage(asyncStorageKey),
      Effect.flatMap(Schema.decode(AesGtmCypher))
    )
    const secretToken = yield* _(getItemFromSecretStorage(secretStorageKey))

    return yield* _(
      aesDecrpytE(secretToken)(encryptedSessionJson),
      Effect.flatMap(Schema.decode(Schema.parseJson(SessionE))),
      Effect.catchAll((e) =>
        pipe(
          taskEitherToEffect(aesDecrypt(encryptedSessionJson, secretToken)),
          Effect.flatMap(Schema.decode(Schema.parseJson(SessionE)))
        )
      )
    )
  })
}

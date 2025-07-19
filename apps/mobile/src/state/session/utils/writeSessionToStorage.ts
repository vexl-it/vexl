import {
  aesEncrpytE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema, type ParseResult} from 'effect/index'
import {SessionE, type Session} from '../../../brands/Session.brand'
import {
  saveItemToAsyncStorage,
  saveItemToSecretStorage,
  type ErrorWritingToStore,
} from '../../../utils/fpUtils'

export default function writeSessionToStorage(
  session: Session,
  {
    asyncStorageKey,
    secretStorageKey,
  }: {asyncStorageKey: string; secretStorageKey: string}
): Effect.Effect<
  void,
  ErrorWritingToStore | ParseResult.ParseError | CryptoError
> {
  return Effect.gen(function* (_) {
    const sessionString = yield* _(
      Schema.encode(Schema.parseJson(SessionE))(session)
    )
    const encryptedSession = yield* _(
      aesEncrpytE(session.privateKey.privateKeyPemBase64)(sessionString)
    )

    yield* _(saveItemToAsyncStorage(asyncStorageKey)(encryptedSession))
    yield* _(
      saveItemToSecretStorage(secretStorageKey)(
        session.privateKey.privateKeyPemBase64
      )
    )
  })
}

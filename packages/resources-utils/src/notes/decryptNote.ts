import {type KeyHolder} from '@vexl-next/cryptography'
import {
  NoteInfo,
  NotePrivatePart,
  NotePublicPart,
} from '@vexl-next/domain/src/general/notes'
import {
  PrivatePayloadEncryptedV1,
  PrivatePayloadEncryptedV2,
} from '@vexl-next/domain/src/general/offers'
import {
  CryptoBoxCypher,
  cryptoBoxUnseal,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {ServerNote} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {Effect, Either, flow, Schema} from 'effect'
import {aesGCMIgnoreTagDecrypt, eciesDecryptE} from '../utils/crypto'

export class DecryptingNoteError extends Schema.TaggedError<DecryptingNoteError>(
  'DecryptingNoteError'
)('DecryptingNoteError', {
  cause: Schema.Unknown,
  message: Schema.String,
  serverNote: ServerNote,
}) {}

export class NonCompatibleNoteVersionError extends Schema.TaggedError<NonCompatibleNoteVersionError>(
  'NonCompatibleNoteVersionError'
)('NonCompatibleNoteVersionError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export default function decryptNote(
  privateKey: KeyHolder.PrivateKeyHolder,
  privateKeyV2: KeyHolder.KeyPairV2
): (
  serverNote: ServerNote
) => Effect.Effect<
  NoteInfo,
  DecryptingNoteError | NonCompatibleNoteVersionError
> {
  return (serverNote: ServerNote) =>
    Effect.gen(function* (_) {
      const isV1 = Schema.is(PrivatePayloadEncryptedV1)(
        serverNote.privatePayload
      )
      const isV2 = Schema.is(PrivatePayloadEncryptedV2)(
        serverNote.privatePayload
      )

      if (!isV1 && !isV2) {
        return yield* _(
          Effect.fail(
            new NonCompatibleNoteVersionError({
              message: 'Non compatible note cypher version',
              cause: new Error('Non compatible note cypher version'),
            })
          )
        )
      }

      const privatePayload = yield* _(
        serverNote.privatePayload.substring(1),
        isV1
          ? eciesDecryptE(privateKey.privateKeyPemBase64)
          : flow(
              Schema.decode(CryptoBoxCypher),
              Effect.flatMap(cryptoBoxUnseal(privateKeyV2))
            ),
        Effect.flatMap(Schema.decodeUnknown(Schema.parseJson(NotePrivatePart))),
        Effect.either
      )

      if (Either.isLeft(privatePayload)) {
        return yield* _(
          Effect.fail(
            new DecryptingNoteError({
              message: 'Error while decrypting note private payload',
              cause: privatePayload.left,
              serverNote,
            })
          )
        )
      }

      const publicPayload = yield* _(
        Effect.succeed(serverNote.publicPayload.substring(1)),
        Effect.flatMap(
          aesGCMIgnoreTagDecrypt(privatePayload.right.symmetricKey)
        ),
        Effect.flatMap(Schema.decodeUnknown(Schema.parseJson(NotePublicPart))),
        Effect.either
      )

      if (Either.isLeft(publicPayload)) {
        return yield* _(
          Effect.fail(
            new DecryptingNoteError({
              message: 'Error while decrypting note public payload',
              cause: publicPayload.left,
              serverNote,
            })
          )
        )
      }

      const note = yield* _(
        Schema.decode(NoteInfo)({
          id: serverNote.id,
          noteId: serverNote.noteId,
          privatePart: privatePayload.right,
          publicPart: publicPayload.right,
          expiresAt: serverNote.expiresAt,
          createdAt: serverNote.createdAt,
          modifiedAt: serverNote.modifiedAt,
        }),
        Effect.either
      )

      if (Either.isLeft(note)) {
        return yield* _(
          Effect.fail(
            new DecryptingNoteError({
              message: 'Error while assembling note info',
              cause: note.left,
              serverNote,
            })
          )
        )
      }

      return note.right
    })
}

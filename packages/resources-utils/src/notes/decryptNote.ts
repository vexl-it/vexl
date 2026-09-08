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
import {Effect, flow, pipe, Result, Schema} from 'effect'
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
    Effect.gen(function* () {
      const isV1 = Schema.is(PrivatePayloadEncryptedV1)(
        serverNote.privatePayload
      )
      const isV2 = Schema.is(PrivatePayloadEncryptedV2)(
        serverNote.privatePayload
      )

      if (!isV1 && !isV2) {
        return yield* Effect.fail(
          new NonCompatibleNoteVersionError({
            message: 'Non compatible note cypher version',
            cause: new Error('Non compatible note cypher version'),
          })
        )
      }

      const privatePayload = yield* pipe(
        serverNote.privatePayload.substring(1),
        isV1
          ? eciesDecryptE(privateKey.privateKeyPemBase64)
          : flow(
              Schema.decodeEffect(CryptoBoxCypher),
              Effect.flatMap(cryptoBoxUnseal(privateKeyV2))
            ),
        Effect.flatMap(
          Schema.decodeUnknownEffect(Schema.fromJsonString(NotePrivatePart))
        ),
        Effect.result
      )

      if (Result.isFailure(privatePayload)) {
        return yield* Effect.fail(
          new DecryptingNoteError({
            message: 'Error while decrypting note private payload',
            cause: privatePayload.failure,
            serverNote,
          })
        )
      }

      const publicPayload = yield* pipe(
        Effect.succeed(serverNote.publicPayload.substring(1)),
        Effect.flatMap(
          aesGCMIgnoreTagDecrypt(privatePayload.success.symmetricKey)
        ),
        Effect.flatMap(
          Schema.decodeUnknownEffect(Schema.fromJsonString(NotePublicPart))
        ),
        Effect.result
      )

      if (Result.isFailure(publicPayload)) {
        return yield* Effect.fail(
          new DecryptingNoteError({
            message: 'Error while decrypting note public payload',
            cause: publicPayload.failure,
            serverNote,
          })
        )
      }

      const note = yield* pipe(
        Schema.decodeEffect(NoteInfo)({
          id: serverNote.id,
          noteId: serverNote.noteId,
          privatePart: privatePayload.success,
          publicPart: publicPayload.success,
          expiresAt: serverNote.expiresAt,
          createdAt: serverNote.createdAt,
          modifiedAt: serverNote.modifiedAt,
        }),
        Effect.result
      )

      if (Result.isFailure(note)) {
        return yield* Effect.fail(
          new DecryptingNoteError({
            message: 'Error while assembling note info',
            cause: note.failure,
            serverNote,
          })
        )
      }

      return note.success
    })
}

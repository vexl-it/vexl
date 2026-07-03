import {NotePublicPart} from '@vexl-next/domain/src/general/notes'
import {
  type SymmetricKey,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'
import {pipe} from 'fp-ts/function'
import {aesGCMIgnoreTagEncrypt} from '../../utils/crypto'

export class NotePublicPartEncryptionError extends Schema.TaggedError<NotePublicPartEncryptionError>(
  'NotePublicPartEncryptionError'
)('NotePublicPartEncryptionError', {
  message: Schema.optional(Schema.String),
  cause: Schema.Unknown,
}) {}

export default function encryptNotePublicPayload({
  notePublicPart,
  symmetricKey,
}: {
  notePublicPart: NotePublicPart
  symmetricKey: SymmetricKey
}): Effect.Effect<PublicPayloadEncrypted, NotePublicPartEncryptionError> {
  return pipe(
    Effect.succeed(notePublicPart),
    Effect.flatMap(Schema.encode(Schema.parseJson(NotePublicPart))),
    Effect.flatMap(aesGCMIgnoreTagEncrypt(symmetricKey)),
    Effect.map((encrypted) => `0${encrypted}`),
    Effect.map(flow(Schema.decode(PublicPayloadEncrypted), Effect.runSync)),
    Effect.mapError(
      (e) =>
        new NotePublicPartEncryptionError({
          message: 'Error encrypting note public payload',
          cause: e,
        })
    )
  )
}

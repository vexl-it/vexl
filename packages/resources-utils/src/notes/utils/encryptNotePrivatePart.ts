import {
  PublicKeyPemBase64,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {isPublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type NotePrivatePart} from '@vexl-next/domain/src/general/notes'
import {
  PRIVATE_PAYLOAD_ENCRYPTED_V2_PREFIX,
  PrivatePayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {cryptoBoxSeal} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {Effect, flow, Schema} from 'effect'
import {eciesEncryptE} from '../../utils/crypto'
import {stringifyE} from '../../utils/parsing'

export interface NotePrivatePayloadToEncrypt {
  toPublicKey: PublicKeyPemBase64 | PublicKeyV2
  payloadPrivate: NotePrivatePart
}

export class NotePrivatePartEncryptionError extends Schema.TaggedError<NotePrivatePartEncryptionError>(
  'NotePrivatePartEncryptionError'
)('NotePrivatePartEncryptionError', {
  cause: Schema.Unknown,
  message: Schema.String,
  toPublicKey: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
}) {}

export function encryptNotePrivatePart(
  privatePart: NotePrivatePayloadToEncrypt
): Effect.Effect<ServerNotePrivatePart, NotePrivatePartEncryptionError> {
  return Effect.gen(function* (_) {
    const privatePartsStringified = yield* _(
      stringifyE(privatePart.payloadPrivate)
    )

    const encrypted = yield* _(
      privatePartsStringified,
      isPublicKeyV2(privatePart.toPublicKey)
        ? flow(
            cryptoBoxSeal(privatePart.toPublicKey),
            Effect.map((c) => `${PRIVATE_PAYLOAD_ENCRYPTED_V2_PREFIX}${c}`)
          )
        : eciesEncryptE(privatePart.toPublicKey),
      Effect.flatMap(Schema.decode(PrivatePayloadEncrypted))
    )

    return {
      userPublicKey: privatePart.toPublicKey,
      payloadPrivate: encrypted,
    }
  }).pipe(
    Effect.catchAll(
      (e) =>
        new NotePrivatePartEncryptionError({
          toPublicKey: privatePart.toPublicKey,
          message: 'Error encrypting note private part',
          cause: e,
        })
    )
  )
}

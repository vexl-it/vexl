import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {NoteId} from '@vexl-next/domain/src/general/notes'
import {
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {NumberFromString} from '@vexl-next/generic-utils/src/effect-helpers/NumberFromString'
import {Schema} from 'effect'

export const NoteAdminIdHashed = Schema.String.pipe(
  Schema.brand('NoteAdminIdHashed')
)
export type NoteAdminIdHashed = Schema.Schema.Type<typeof NoteAdminIdHashed>

export const NoteRepostIdHashed = Schema.String.pipe(
  Schema.brand('NoteRepostIdHashed')
)
export type NoteRepostIdHashed = Schema.Schema.Type<typeof NoteRepostIdHashed>

export const NotePublicPartId = NumberFromString.pipe(
  Schema.brand('NotePublicPartId')
)
export type NotePublicPartId = Schema.Schema.Type<typeof NotePublicPartId>

export const NotePrivatePartRecordId = NumberFromString.pipe(
  Schema.brand('NotePrivatePartRecordId'),
  Schema.check(Schema.isGreaterThanOrEqualTo(0))
)
export type NotePrivatePartRecordId = Schema.Schema.Type<
  typeof NotePrivatePartRecordId
>

export const NoteChangeCounter = NumberFromString.pipe(
  Schema.brand('NoteChangeCounter'),
  Schema.check(Schema.isGreaterThanOrEqualTo(0))
)
export type NoteChangeCounter = Schema.Schema.Type<typeof NoteChangeCounter>

export class NotePublicPartRecord extends Schema.Class<NotePublicPartRecord>(
  'NotePublicPartRecord'
)({
  id: NotePublicPartId,
  adminId: NoteAdminIdHashed,
  noteId: NoteId,
  payloadPublic: PublicPayloadEncrypted,
  expiresAt: Schema.Date,
  createdAt: Schema.Date,
  report: Schema.Int.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
}) {}

export class NotePrivatePartRecord extends Schema.Class<NotePrivatePartRecord>(
  'NotePrivatePartRecord'
)({
  id: NotePrivatePartRecordId,
  userPublicKey: Schema.Union([PublicKeyPemBase64, PublicKeyV2]),
  noteId: NotePublicPartId,
  payloadPrivate: PrivatePayloadEncrypted,
}) {}

export const NoteParts = Schema.Struct({
  publicPart: NotePublicPartRecord,
  privatePart: NotePrivatePartRecord,
})
export type NoteParts = Schema.Schema.Type<typeof NoteParts>

export const NotePartsWithNoteForUserUpdateCounter = Schema.Struct({
  publicPart: NotePublicPartRecord,
  privatePart: NotePrivatePartRecord,
  noteForUserUpdateCounter: NoteChangeCounter,
})
export type NotePartsWithNoteForUserUpdateCounter = Schema.Schema.Type<
  typeof NotePartsWithNoteForUserUpdateCounter
>

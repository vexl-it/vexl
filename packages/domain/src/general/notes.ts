import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {getCrypto} from '@vexl-next/cryptography/src/getCrypto'
import {Schema} from 'effect'
import {IdNumeric} from '../utility/IdNumeric'
import {IsoDatetimeString} from '../utility/IsoDatetimeString.brand'
import {SemverString} from '../utility/SmeverString.brand'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'
import {HashedPhoneNumber} from './HashedPhoneNumber.brand'
import {VexlNotificationToken} from './notifications/VexlNotificationToken'
import {FriendLevel, SymmetricKey} from './offers'

export const NoteId = Schema.UUID.pipe(Schema.brand('NoteId'))
export type NoteId = typeof NoteId.Type

export const newNoteId = (): NoteId =>
  Schema.decodeSync(NoteId)(getCrypto().randomUUID())

export const NoteAdminId = Schema.UUID.pipe(Schema.brand('NoteAdminId'))
export type NoteAdminId = typeof NoteAdminId.Type

export function generateNoteAdminId(): NoteAdminId {
  return Schema.decodeSync(NoteAdminId)(getCrypto().randomUUID())
}

export const NoteRepostId = Schema.UUID.pipe(Schema.brand('NoteRepostId'))
export type NoteRepostId = typeof NoteRepostId.Type

export function generateNoteRepostId(): NoteRepostId {
  return Schema.decodeSync(NoteRepostId)(getCrypto().randomUUID())
}

export const NOTE_TEXT_MAX_LENGTH = 500

export const NoteExpiresAfterDaysOptions = [7, 3, 1] as const
export const NOTE_MAX_EXPIRATION_DAYS = 7

export const NotePrivatePart = Schema.Struct({
  commonFriends: Schema.Array(HashedPhoneNumber),
  friendLevel: Schema.Array(FriendLevel),
  symmetricKey: SymmetricKey,
  viaRepost: Schema.optionalWith(Schema.Boolean, {default: () => false}),
  // For admin only
  adminId: Schema.optional(NoteAdminId),
})
export type NotePrivatePart = typeof NotePrivatePart.Type

export const NotePublicPart = Schema.Struct({
  notePublicKey: PublicKeyPemBase64,
  text: Schema.String.pipe(Schema.maxLength(NOTE_TEXT_MAX_LENGTH)),
  allowRepost: Schema.Boolean,
  vexlNotificationToken: Schema.optional(VexlNotificationToken),
  authorClientVersion: Schema.optional(SemverString),
})
export type NotePublicPart = typeof NotePublicPart.Type

export const NoteInfo = Schema.Struct({
  id: IdNumeric, // For ordering
  noteId: NoteId,
  privatePart: NotePrivatePart,
  publicPart: NotePublicPart,
  expiresAt: UnixMilliseconds,
  createdAt: IsoDatetimeString,
  modifiedAt: IsoDatetimeString,
})
export type NoteInfo = typeof NoteInfo.Type

export const NoteFlags = Schema.Struct({
  reported: Schema.optionalWith(Schema.Boolean, {default: () => false}),
})
export type NoteFlags = typeof NoteFlags.Type

export const NoteOwnershipInfo = Schema.Struct({
  adminId: NoteAdminId,
})
export type NoteOwnershipInfo = typeof NoteOwnershipInfo.Type

export const NoteRepostInfo = Schema.Struct({
  repostId: NoteRepostId,
  repostedAt: UnixMilliseconds,
})
export type NoteRepostInfo = typeof NoteRepostInfo.Type

export const OneNoteInState = Schema.Struct({
  noteInfo: NoteInfo,
  flags: NoteFlags,
  ownershipInfo: Schema.optional(NoteOwnershipInfo),
  repostInfo: Schema.optional(NoteRepostInfo),
})
export type OneNoteInState = typeof OneNoteInState.Type

export const MyNoteInState = Schema.Struct({
  noteInfo: NoteInfo,
  flags: NoteFlags,
  ownershipInfo: NoteOwnershipInfo,
  repostInfo: Schema.optional(NoteRepostInfo),
})
export type MyNoteInState = typeof MyNoteInState.Type

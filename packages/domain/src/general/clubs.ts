import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {Brand, Schema} from 'effect'
import {randomUUID} from 'node:crypto'
import {z} from 'zod'
import {ExpoNotificationTokenE} from '../utility/ExpoNotificationToken.brand'
import {UriStringE} from '../utility/UriString.brand'

export class ClubKeyNotFoundInInnerStateError extends Schema.TaggedError<ClubKeyNotFoundInInnerStateError>(
  'ClubKeyNotFoundInInnerStateError'
)('ClubKeyNotFoundInInnerStateError', {
  cause: Schema.Unknown,
}) {}

export const ClubUuid = z
  .string()
  .uuid()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'ClubUuid'>>()(v))
export const ClubUuidE = Schema.UUID.pipe(Schema.brand('ClubUuid'))
export type ClubUuid = Schema.Schema.Type<typeof ClubUuidE>

export const generateClubUuid = (): ClubUuid =>
  Schema.decodeSync(ClubUuidE)(randomUUID())

export const ClubInfo = Schema.Struct({
  uuid: ClubUuidE,
  name: Schema.String,
  description: Schema.optionalWith(Schema.String, {as: 'Option'}),
  membersCountLimit: Schema.Number,
  clubImageUrl: UriStringE,
  validUntil: Schema.DateFromString,
})
export type ClubInfo = typeof ClubInfo.Type

export const ClubInfoForUser = Schema.Struct({
  club: ClubInfo,
  isModerator: Schema.Boolean,
})
export type ClubInfoForUser = typeof ClubInfoForUser.Type

export const ClubAdmitionRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  notificationToken: Schema.optionalWith(ExpoNotificationTokenE, {
    as: 'Option',
  }),
  langCode: Schema.String,
})
export type ClubAdmitionRequest = typeof ClubAdmitionRequest.Type

export const ClubCode = Schema.String.pipe(Schema.brand('ClubCode'))
export type ClubCode = Schema.Schema.Type<typeof ClubCode>

export const ClubLinkInfo = Schema.Struct({
  code: ClubCode,
  fullLink: Schema.String,
})
export type ClubLinkInfo = Schema.Schema.Type<typeof ClubLinkInfo>

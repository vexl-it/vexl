import {getCrypto} from '@vexl-next/cryptography/src/getCrypto'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'
import {ExpoNotificationToken} from '../utility/ExpoNotificationToken.brand'
import {UriString} from '../utility/UriString.brand'

export class ClubKeyNotFoundInInnerStateError extends Schema.TaggedError<ClubKeyNotFoundInInnerStateError>(
  'ClubKeyNotFoundInInnerStateError'
)('ClubKeyNotFoundInInnerStateError', {
  cause: Schema.Unknown,
}) {}

export const ClubUuid = Schema.UUID.pipe(Schema.brand('ClubUuid'))
export type ClubUuid = typeof ClubUuid.Type

export const generateClubUuid = (): ClubUuid =>
  Schema.decodeSync(ClubUuid)(getCrypto().randomUUID())

export const ClubInfo = Schema.Struct({
  uuid: ClubUuid,
  name: Schema.String,
  description: Schema.optionalWith(Schema.String, {as: 'Option'}),
  membersCountLimit: Schema.Number,
  clubImageUrl: UriString,
  validUntil: Schema.DateFromString,
  reportLimit: Schema.optionalWith(Schema.Int, {default: () => 0}),
})
export type ClubInfo = typeof ClubInfo.Type

export const ClubInfoForUser = Schema.Struct({
  club: ClubInfo,
  isModerator: Schema.Boolean,
})
export type ClubInfoForUser = typeof ClubInfoForUser.Type

export const ClubAdmitionRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  notificationToken: Schema.optionalWith(ExpoNotificationToken, {
    as: 'Option',
  }),
  langCode: Schema.String,
})
export type ClubAdmitionRequest = typeof ClubAdmitionRequest.Type

export const ClubCode = Schema.String.pipe(Schema.brand('ClubCode'))
export type ClubCode = typeof ClubCode.Type

export const ClubLinkInfo = Schema.Struct({
  code: ClubCode,
  fullLink: Schema.String,
})
export type ClubLinkInfo = typeof ClubLinkInfo.Type

export const OfferIdHashed = Schema.String.pipe(Schema.brand('OfferIdHashed'))
export type OfferIdHashed = typeof OfferIdHashed.Type

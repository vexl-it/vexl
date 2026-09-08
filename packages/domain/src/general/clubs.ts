import {getCrypto} from '@vexl-next/cryptography/src/getCrypto'
import {
  PublicKeyPemBase64,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, Option, Schema} from 'effect'
import {ExpoNotificationToken} from '../utility/ExpoNotificationToken.brand'
import {UriString} from '../utility/UriString.brand'
import {VexlNotificationToken} from './notifications/VexlNotificationToken'

export class ClubKeyNotFoundInInnerStateError extends Schema.TaggedError<ClubKeyNotFoundInInnerStateError>(
  'ClubKeyNotFoundInInnerStateError'
)('ClubKeyNotFoundInInnerStateError', {
  cause: Schema.Unknown,
}) {}

export const ClubUuid = Schema.String.check(Schema.isUUID()).pipe(
  Schema.brand('ClubUuid')
)
export type ClubUuid = typeof ClubUuid.Type

export const generateClubUuid = (): ClubUuid =>
  Schema.decodeSync(ClubUuid)(getCrypto().randomUUID())

export const ClubInfo = Schema.Struct({
  uuid: ClubUuid,
  name: Schema.String,
  description: Schema.OptionFromOptional(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  membersCountLimit: Schema.Number,
  clubImageUrl: UriString,
  validUntil: Schema.DateFromString,
  reportLimit: Schema.Int.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 0 => 0)),
    Schema.withConstructorDefault(Effect.sync((): 0 => 0))
  ),
})
export type ClubInfo = typeof ClubInfo.Type

export const ClubMadeInactiveReason = Schema.Literals([
  'EXPIRED',
  'FLAGGED',
  'UNKNOWN',
])
export type ClubMadeInactiveReason = typeof ClubMadeInactiveReason.Type

/** Must be positive because a limit of 0 auto-deactivates the club immediately. */
export const ClubReportLimit = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThan(0))
)
export type ClubReportLimit = typeof ClubReportLimit.Type

export const ClubInfoAdminInput = Schema.Struct({
  ...ClubInfo.fields,
  reportLimit: ClubReportLimit,
})
export type ClubInfoAdminInput = typeof ClubInfoAdminInput.Type

export const ClubAdminInfo = Schema.Struct({
  ...ClubInfo.fields,
  membersCount: Schema.Int,
  membersJoinedLast30Days: Schema.Int,
  membersLeftLast30Days: Schema.Int,
  report: Schema.Int,
  madeInactiveAt: Schema.OptionFromOptionalNullOr(Schema.DateFromString).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  madeInactiveReason: Schema.OptionFromOptionalNullOr(
    ClubMadeInactiveReason
  ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
})
export type ClubAdminInfo = typeof ClubAdminInfo.Type

export const ClubInfoForUser = Schema.Struct({
  club: ClubInfo,
  isModerator: Schema.Boolean,
  vexlNotificationToken: Schema.OptionFromOptional(VexlNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type ClubInfoForUser = typeof ClubInfoForUser.Type

export const ClubAdmitionRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  // todo #2124 remove after all clients are migrated to vexl notification tokens
  publicKeyV2: PublicKeyV2,
  notificationToken: Schema.OptionFromOptional(ExpoNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  vexlNotificationToken: Schema.OptionFromOptional(VexlNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
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

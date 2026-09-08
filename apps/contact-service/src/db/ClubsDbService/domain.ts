import {
  ClubMadeInactiveReason,
  ClubUuid,
} from '@vexl-next/domain/src/general/clubs'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Option, Schema} from 'effect'

// Club table schema
export const ClubRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('ClubRecordId')
)
export type ClubRecordId = typeof ClubRecordId.Type

export class ClubDbRecord extends Schema.Class<ClubDbRecord>('ClubDbRecord')({
  id: ClubRecordId,
  uuid: ClubUuid,
  name: Schema.String,
  description: Schema.OptionFromOptionalNullOr(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  membersCountLimit: Schema.Number,
  clubImageUrl: UriString,
  validUntil: Schema.Date,
  madeInactiveAt: Schema.OptionFromOptionalNullOr(Schema.Date).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  madeInactiveReason: Schema.OptionFromOptionalNullOr(
    ClubMadeInactiveReason
  ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  report: Schema.Int,
  reportLimit: Schema.Int,
}) {}

export class ClubAdminDbRecord extends Schema.Class<ClubAdminDbRecord>(
  'ClubAdminDbRecord'
)({
  ...ClubDbRecord.fields,
  membersCount: Schema.Int,
  membersJoinedLast30Days: Schema.Int,
  membersLeftLast30Days: Schema.Int,
}) {}

// Club offer reported info table schema
export const ClubOfferReporedInfoRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('ClubOfferReporedInfoRecordId')
)
export type ClubOfferReporedInfoRecordId =
  typeof ClubOfferReporedInfoRecordId.Type
export class ClubOfferReporedInfoRecord extends Schema.Class<ClubOfferReporedInfoRecord>(
  'ClubOfferReporedInfoRecord'
)({
  id: ClubOfferReporedInfoRecordId,
  offerId: Schema.String,
  clubUuid: ClubUuid,
  reportedAt: Schema.Date,
}) {}

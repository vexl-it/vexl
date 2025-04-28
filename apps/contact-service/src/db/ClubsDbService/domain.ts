import {ClubUuidE} from '@vexl-next/domain/src/general/clubs'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {Schema} from 'effect'

// Club table schema
export const ClubRecordId = Schema.BigInt.pipe(Schema.brand('ClubRecordId'))
export type ClubRecordId = typeof ClubRecordId.Type

export class ClubDbRecord extends Schema.Class<ClubDbRecord>('ClubDbRecord')({
  id: ClubRecordId,
  uuid: ClubUuidE,
  name: Schema.String,
  description: Schema.optionalWith(Schema.String, {
    as: 'Option',
    nullable: true,
  }),
  membersCountLimit: Schema.Number,
  clubImageUrl: UriStringE,
  validUntil: Schema.DateFromSelf,
  madeInactiveAt: Schema.optionalWith(Schema.DateFromSelf, {
    as: 'Option',
    nullable: true,
  }),
  report: Schema.Number,
}) {}

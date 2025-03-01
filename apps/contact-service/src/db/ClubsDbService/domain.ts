import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Schema} from 'effect'

// Club table schema
export const ClubRecordId = Schema.BigInt.pipe(Schema.brand('ClubRecordId'))

export class ClubDbRecord extends Schema.Class<ClubDbRecord>('ClubDbRecord')({
  id: ClubRecordId,
  uuid: ClubUuid,
  name: Schema.String,
  description: Schema.optionalWith(Schema.String, {as: 'Option'}),
  membersCountLimit: Schema.Number,
  clubImageUrl: Schema.String,
  validUntil: Schema.Date,
}) {}

// Club invitation link table schema

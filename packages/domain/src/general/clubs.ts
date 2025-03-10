import {Schema} from 'effect'
import {randomUUID} from 'node:crypto'
import {UriStringE} from '../utility/UriString.brand'

export const ClubUuid = Schema.UUID.pipe(Schema.brand('ClubUuid'))
export type ClubUuid = Schema.Schema.Type<typeof ClubUuid>
export const generateClubUuid = (): ClubUuid =>
  Schema.decodeSync(ClubUuid)(randomUUID())

export const ClubInfo = Schema.Struct({
  uuid: ClubUuid,
  name: Schema.String,
  description: Schema.optionalWith(Schema.String, {as: 'Option'}),
  membersCountLimit: Schema.Number,
  clubImageUrl: UriStringE,
  validUntil: Schema.DateFromString,
})

export const ClubInfoForUser = Schema.Struct({
  club: ClubInfo,
  isModerator: Schema.Boolean,
})

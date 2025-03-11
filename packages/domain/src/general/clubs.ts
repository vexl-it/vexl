import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'
import {randomUUID} from 'node:crypto'
import {ExpoNotificationTokenE} from '../utility/ExpoNotificationToken.brand'
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

export const ClubAdmitionRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  notificationToken: Schema.optionalWith(ExpoNotificationTokenE, {
    as: 'Option',
  }),
  langCode: Schema.String,
})

export const ClubCode = Schema.String.pipe(Schema.brand('ClubCode'))
export type ClubCode = Schema.Schema.Type<typeof ClubCode>

export const ClubLinkInfo = Schema.Struct({
  code: ClubCode,
  fullLink: Schema.String,
})
export type ClubLinkInfo = Schema.Schema.Type<typeof ClubLinkInfo>

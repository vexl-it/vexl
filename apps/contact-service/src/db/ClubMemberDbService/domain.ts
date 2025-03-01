import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'
import {ClubRecordId} from '../ClubsDbService/domain'

export const ClubMemberRecordId = Schema.BigInt.pipe(
  Schema.brand('ClubMemberRecordId')
)
export class ClubMemberRecord extends Schema.Class<ClubMemberRecord>(
  'ClubMemberRecord'
)({
  id: ClubMemberRecordId,
  clubId: ClubRecordId,
  publicKey: PublicKeyPemBase64E,
  notificationToken: Schema.String, // TODO change to brand
  lastRefreshedAt: Schema.Date,
  isModerator: Schema.optionalWith(Schema.Boolean, {default: () => false}),
}) {}

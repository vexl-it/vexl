import {Schema} from 'effect'
import {ClubRecordId} from '../ClubsDbService/domain'
import {UserRecordId} from '../UserDbService/domain'

export const ClubInvitationLinkRecordId = Schema.BigInt.pipe(
  Schema.brand('ClubInvitationLinkRecordId')
)
export class ClubInvitationLinkRecord extends Schema.Class<ClubInvitationLinkRecord>(
  'ClubInvitationLinkRecord'
)({
  id: ClubInvitationLinkRecordId,
  clubId: ClubRecordId,
  createdByMemberId: Schema.NullOr(UserRecordId),
  forAdmin: Schema.Boolean,
  code: Schema.String, // Needs to be in plain text due to the need to generate a QR code
}) {}

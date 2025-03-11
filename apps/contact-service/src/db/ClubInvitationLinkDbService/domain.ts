import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {Schema} from 'effect'
import {ClubMemberRecordId} from '../ClubMemberDbService/domain'
import {ClubRecordId} from '../ClubsDbService/domain'

export const ClubInvitationLinkRecordId = Schema.BigInt.pipe(
  Schema.brand('ClubInvitationLinkRecordId')
)
export class ClubInvitationLinkRecord extends Schema.Class<ClubInvitationLinkRecord>(
  'ClubInvitationLinkRecord'
)({
  id: ClubInvitationLinkRecordId,
  clubId: ClubRecordId,
  createdByMemberId: Schema.NullOr(ClubMemberRecordId),
  forAdmin: Schema.Boolean,
  code: ClubCode,
}) {}

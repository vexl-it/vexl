import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
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
  publicKey: PublicKeyPemBase64,
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  vexlNotificationToken: Schema.NullOr(VexlNotificationToken),
  lastRefreshedAt: Schema.DateFromSelf,
  isModerator: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
    nullable: true,
  }),
}) {}

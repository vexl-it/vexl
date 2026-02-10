import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
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
  // V2 public key for club-specific encryption
  publicKeyV2: Schema.optionalWith(PublicKeyV2, {
    as: 'Option',
    nullable: true,
  }),
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  lastRefreshedAt: Schema.DateFromSelf,
  isModerator: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
    nullable: true,
  }),
}) {}

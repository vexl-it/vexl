import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {withNullishDefault} from '@vexl-next/generic-utils/src/effect-helpers/optionalNullable'
import {Schema} from 'effect'
import {ClubRecordId} from '../ClubsDbService/domain'

export const ClubMemberRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('ClubMemberRecordId')
)
export class ClubMemberRecord extends Schema.Class<ClubMemberRecord>(
  'ClubMemberRecord'
)({
  id: ClubMemberRecordId,
  clubId: ClubRecordId,
  publicKey: PublicKeyPemBase64,
  // V2 public key for club-specific encryption
  publicKeyV2: Schema.NullOr(PublicKeyV2),
  notificationToken: Schema.NullOr(ExpoNotificationToken),
  vexlNotificationToken: Schema.NullOr(VexlNotificationToken),
  lastRefreshedAt: Schema.Date,
  isModerator: withNullishDefault(Schema.Boolean, () => false),
}) {}

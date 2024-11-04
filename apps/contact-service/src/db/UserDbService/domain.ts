import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api/src/PlatformName'

export const UserRecordId = Schema.BigInt.pipe(Schema.brand('UserRecordId'))
export class UserRecord extends Schema.Class<UserRecord>('UserRecord')({
  id: UserRecordId,
  publicKey: PublicKeyPemBase64E,
  hash: HashedPhoneNumberE,
  clientVersion: Schema.optionalWith(VersionCode, {
    as: 'Option',
    nullable: true,
  }),
  firebaseToken: Schema.optionalWith(FcmTokenE, {as: 'Option', nullable: true}),
  refreshedAt: Schema.optionalWith(Schema.DateFromSelf, {
    as: 'Option',
    nullable: true,
  }),
  platform: Schema.optionalWith(PlatformName, {as: 'Option', nullable: true}),
  lastNewContentNotificaionSentAt: Schema.optionalWith(VersionCode, {
    as: 'Option',
    nullable: true,
  }),
  initialImportDone: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
}) {}

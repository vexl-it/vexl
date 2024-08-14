import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformNameE} from '@vexl-next/rest-api/src/PlatformName'

export const UserRecordId = Schema.BigInt.pipe(Schema.brand('UserRecordId'))
export class UserRecord extends Schema.Class<UserRecord>('UserRecord')({
  id: UserRecordId,
  publicKey: PublicKeyPemBase64E,
  hash: HashedPhoneNumberE,
  clientVersion: VersionCode,
  firebaseToken: Schema.optionalWith(FcmTokenE, {as: 'Option'}),
  refreshedAt: Schema.optionalWith(Schema.Date, {as: 'Option'}),
  platform: Schema.optionalWith(PlatformNameE, {as: 'Option'}),
  lastNewContentNotificaionSentAt: Schema.optionalWith(VersionCode, {
    as: 'Option',
  }),
}) {}

import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Schema} from 'effect'
import {ServerHashedNumber} from '../../utils/serverHashContact'

export const UserRecordId = Schema.BigInt.pipe(Schema.brand('UserRecordId'))
export type UserRecordId = typeof UserRecordId.Type

export class UserRecord extends Schema.Class<UserRecord>('UserRecord')({
  id: UserRecordId,
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  clientVersion: Schema.optionalWith(VersionCode, {
    as: 'Option',
    nullable: true,
  }),
  firebaseToken: Schema.optionalWith(FcmToken, {as: 'Option', nullable: true}),
  expoToken: Schema.optionalWith(ExpoNotificationToken, {
    as: 'Option',
    nullable: true,
  }),
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
    nullable: true,
  }),
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
  countryPrefix: Schema.optionalWith(CountryPrefix, {
    as: 'Option',
    nullable: true,
  }),
  appSource: Schema.optionalWith(AppSource, {
    as: 'Option',
    nullable: true,
  }),
}) {}

export const NotificationTokens = Schema.Struct({
  firebaseToken: Schema.optionalWith(FcmToken, {as: 'Option', nullable: true}),
  expoToken: Schema.optionalWith(ExpoNotificationToken, {
    as: 'Option',
    nullable: true,
  }),
  vexlNotificationToken: Schema.optionalWith(VexlNotificationToken, {
    as: 'Option',
    nullable: true,
  }),
})
export type NotificationTokens = typeof NotificationTokens.Type
export const NotificationsTokensEquivalence =
  Schema.equivalence(NotificationTokens)

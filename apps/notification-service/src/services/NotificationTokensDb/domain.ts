import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecretNotTemporary,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Schema} from 'effect'

export const NotificationTokenRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('NotificationTokenRecordId')
)
export type NotificationTokenRecordId = typeof NotificationTokenRecordId.Type

export const NotificationSecretRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('NotificationSecretRecordId')
)
export type NotificationSecretRecordId = typeof NotificationSecretRecordId.Type

export class NotificationTokenRecord extends Schema.Class<NotificationTokenRecord>(
  'NotificationTokenRecord'
)({
  id: NotificationTokenRecordId,
  token: VexlNotificationToken,
  secretId: NotificationSecretRecordId,
}) {}

export class NotificationSecretRecord extends Schema.Class<NotificationSecretRecord>(
  'NotificationSecretRecord'
)({
  id: NotificationSecretRecordId,
  secret: VexlNotificationTokenSecretNotTemporary,
  expoNotificationToken: Schema.NullOr(ExpoNotificationToken),
  systemVexlToken: Schema.NullOr(VexlNotificationToken),
  marketingVexlToken: Schema.NullOr(VexlNotificationToken),
  clientPlatform: PlatformName,
  clientVersion: VersionCode,
  clientAppSource: AppSource,
  clientLanguage: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
  clientPrefix: Schema.NullOr(CountryPrefix),
  backgroundSocketEnabled: Schema.Boolean,
}) {}

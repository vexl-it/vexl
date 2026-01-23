import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  VexlNotificationToken,
  VexlNotificationTokenSecretNotTemporary,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Schema} from 'effect/index'

export const NotificationTokenRecordId = Schema.BigInt.pipe(
  Schema.brand('NotificationTokenRecordId')
)
export type NotificationTokenRecordId = typeof NotificationTokenRecordId.Type

export const NotificationSecretRecordId = Schema.BigInt.pipe(
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
  clientPlatform: PlatformName,
  clientVersion: VersionCode,
  clientAppSource: AppSource,
  clientLanguage: Schema.String,
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
  clientPrefix: Schema.NullOr(CountryPrefix),
}) {}

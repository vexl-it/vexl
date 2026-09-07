import {UserNotificationMqEntry} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Schema} from 'effect'

export const PendingBatchedNotificationRecordId = Schema.BigIntFromString.pipe(
  Schema.brand('PendingBatchedNotificationRecordId')
)
export type PendingBatchedNotificationRecordId =
  typeof PendingBatchedNotificationRecordId.Type

const PendingBatchedNotificationRecordIdFromSelf = Schema.BigInt.pipe(
  Schema.brand('PendingBatchedNotificationRecordId')
)

export class PendingBatchedNotificationDbRecord extends Schema.Class<PendingBatchedNotificationDbRecord>(
  'PendingBatchedNotificationDbRecord'
)({
  id: PendingBatchedNotificationRecordIdFromSelf,
  createdAt: Schema.Date,
  notificationData: Schema.fromJsonString(UserNotificationMqEntry),
}) {}

export class RawPendingBatchedNotificationDbRecord extends Schema.Class<RawPendingBatchedNotificationDbRecord>(
  'RawPendingBatchedNotificationDbRecord'
)({
  id: PendingBatchedNotificationRecordId,
  createdAt: Schema.Date,
  notificationData: Schema.String,
}) {}

import {UserNotificationMqEntry} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Schema} from 'effect'

export const PendingBatchedNotificationRecordId = Schema.BigInt.pipe(
  Schema.brand('PendingBatchedNotificationRecordId')
)
export type PendingBatchedNotificationRecordId =
  typeof PendingBatchedNotificationRecordId.Type

const PendingBatchedNotificationRecordIdFromSelf = Schema.BigIntFromSelf.pipe(
  Schema.brand('PendingBatchedNotificationRecordId')
)

export class PendingBatchedNotificationDbRecord extends Schema.Class<PendingBatchedNotificationDbRecord>(
  'PendingBatchedNotificationDbRecord'
)({
  id: PendingBatchedNotificationRecordIdFromSelf,
  createdAt: Schema.DateFromSelf,
  notificationData: Schema.parseJson(UserNotificationMqEntry),
}) {}

export class RawPendingBatchedNotificationDbRecord extends Schema.Class<RawPendingBatchedNotificationDbRecord>(
  'RawPendingBatchedNotificationDbRecord'
)({
  id: PendingBatchedNotificationRecordId,
  createdAt: Schema.DateFromSelf,
  notificationData: Schema.String,
}) {}

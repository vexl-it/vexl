import {
  VexlProductNotificationUuid,
  type VexlProductNotification,
} from '@vexl-next/domain/src/general/vexlProductNotification'
import {Schema} from 'effect'

export const VexlProductNotificationRecordId = Schema.BigInt.pipe(
  Schema.brand('VexlProductNotificationRecordId')
)
export type VexlProductNotificationRecordId =
  typeof VexlProductNotificationRecordId.Type

export class VexlProductNotificationDbRecord extends Schema.Class<VexlProductNotificationDbRecord>(
  'VexlProductNotificationDbRecord'
)({
  id: VexlProductNotificationRecordId,
  uuid: VexlProductNotificationUuid,
  title: Schema.String,
  description: Schema.String,
  issuePushNotification: Schema.Boolean,
  date: Schema.DateFromSelf,
  actionLink: Schema.NullOr(Schema.String),
  actionText: Schema.NullOr(Schema.String),
  type: Schema.Literal('MARKETING', 'GENERAL'),
}) {}

export const vexlProductNotificationFromDbRecord = (
  record: VexlProductNotificationDbRecord
): VexlProductNotification =>
  ({
    uuid: record.uuid,
    title: record.title,
    description: record.description,
    issuePushNotification: record.issuePushNotification,
    date: record.date,
    type: record.type,
    ...(record.actionLink === null ? {} : {actionLink: record.actionLink}),
    ...(record.actionText === null ? {} : {actionText: record.actionText}),
  }) satisfies VexlProductNotification

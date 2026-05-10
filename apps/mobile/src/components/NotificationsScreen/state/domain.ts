import {PublicKeyV2} from '@vexl-next/cryptography'
import {ClubInfo} from '@vexl-next/domain/src/general/clubs'
import {ClubDeactivatedNotificationData} from '@vexl-next/domain/src/general/notifications'
import {VexlProductNotification} from '@vexl-next/domain/src/general/vexlProductNotification'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect/index'

export const NotificationStatus = Schema.Struct({
  isSeen: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  isCancelled: Schema.Boolean,
})
export type NotificationStatus = typeof NotificationStatus.Type

export const VexlProductNotificationData = Schema.TaggedStruct(
  'VexlProductNotificationData',
  {
    productNotification: VexlProductNotification,
  }
)
export type VexlProductNotificationData =
  typeof VexlProductNotificationData.Type

export const ClubAdmissionNotificationData = Schema.TaggedStruct(
  'ClubAdmissionNotificationData',
  {
    pubKey: PublicKeyV2,
    clubInfo: ClubInfo,
  }
)
export type ClubAdmissionNotificationData =
  typeof ClubAdmissionNotificationData.Type

export const ClubDeactivationNotificationData = Schema.TaggedStruct(
  'ClubDeactivationNotificationData',
  {
    pubKey: PublicKeyV2,
    clubInfo: ClubInfo,
    reason: ClubDeactivatedNotificationData.fields.reason,
  }
)
export type ClubDeactivationNotificationData =
  typeof ClubDeactivationNotificationData.Type

export const NotificationCenterRecordData = Schema.Union(
  VexlProductNotificationData,
  ClubAdmissionNotificationData,
  ClubDeactivationNotificationData
)
export type NotificationCenterRecordData =
  typeof NotificationCenterRecordData.Type

export const NotificationCenterRecordId = Schema.String.pipe(
  Schema.brand('NotificationCenterRecordId')
)
export type NotificationCenterRecordId = typeof NotificationCenterRecordId.Type

export const NotificationCenterRecord = Schema.Struct({
  id: NotificationCenterRecordId,
  date: UnixMilliseconds,
  data: NotificationCenterRecordData,
  status: NotificationStatus,
})

export type NotificationCenterRecord = typeof NotificationCenterRecord.Type

import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {orElseSchema} from '@vexl-next/generic-utils/src/effect-helpers/orElseSchema'
import {Schema} from 'effect'
import {BooleanFromString} from 'effect/Schema'
import {UnixMilliseconds} from '../../utility/UnixMilliseconds.brand'
import {ClubUuid} from '../clubs'
import {NotificationTrackingId} from '../NotificationTrackingId.brand'
import {NotificationCypher} from './NotificationCypher.brand'

export const FcmCypher = Schema.String.pipe(Schema.brand('FcmCypher'))
export type FcmCypher = typeof FcmCypher.Type

export const ChatNotificationType = Schema.Literal(
  'MESSAGE',
  'REQUEST_REVEAL',
  'APPROVE_REVEAL',
  'DISAPPROVE_REVEAL',
  'REQUEST_MESSAGING',
  'APPROVE_MESSAGING',
  'DISAPPROVE_MESSAGING',
  'DELETE_CHAT',
  'BLOCK_CHAT',
  'CANCEL_REQUEST_MESSAGING',
  'REQUEST_CONTACT_REVEAL',
  'APPROVE_CONTACT_REVEAL',
  'DISAPPROVE_CONTACT_REVEAL',
  'VERSION_UPDATE',
  'FCM_CYPHER_UPDATE',
  'MESSAGE_READ',
  'UNKNOWN'
)

export class ChatNotificationData extends Schema.Class<ChatNotificationData>(
  'NotificationData'
)({
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
  type: ChatNotificationType.pipe(orElseSchema('UNKNOWN')),
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
  preview: Schema.String.pipe(Schema.optional),
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(ChatNotificationData)
}

export class NewChatMessageNoticeNotificationData extends Schema.TaggedClass<NewChatMessageNoticeNotificationData>(
  'NewChatMessageNoticeNotificationData'
)('NewChatMessageNoticeNotificationData', {
  targetCypher: NotificationCypher,
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
  sentAt: Schema.compose(Schema.NumberFromString, UnixMilliseconds),
  // Is true if the notification was sent with a system notification
  // (i.e. a notification that shows up in the system tray)
  // This will be false for foreground notifications that do not show up in the system tray
  // but are still sent to the device
  includesSystemNotification: BooleanFromString,
  // wether there was also a system notification sent along with the chat notification
  // Will be true for both background and foreground notifications if there was a
  // system notification sent
  systemNotificationSent: Schema.optionalWith(Schema.BooleanFromString, {
    as: 'Option',
  }),
}) {
  static parseUnkownOption = Schema.decodeUnknownOption(
    NewChatMessageNoticeNotificationData
  )
}

export class NewClubConnectionNotificationData extends Schema.TaggedClass<NewClubConnectionNotificationData>(
  'NewClubConnectionNotificationData'
)('NewClubConnectionNotificationData', {
  clubUuids: Schema.parseJson(Schema.NonEmptyArray(ClubUuid)),
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(NewClubConnectionNotificationData)(this)
}

export class NewSocialNetworkConnectionNotificationData extends Schema.TaggedClass<NewSocialNetworkConnectionNotificationData>(
  'NewSocialNetworkConnectionNotificationData'
)('NewSocialNetworkConnectionNotificationData', {
  type: Schema.Literal('NEW_APP_USER'), // backward compatibility
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
  sentAt: Schema.compose(Schema.NumberFromString, UnixMilliseconds),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(NewSocialNetworkConnectionNotificationData)(this)
}

export class AdmitedToClubNetworkNotificationData extends Schema.TaggedClass<AdmitedToClubNetworkNotificationData>(
  'AdmitedToClubNetworkNotificationData'
)('AdmitedToClubNetworkNotificationData', {
  publicKey: PublicKeyPemBase64,
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(AdmitedToClubNetworkNotificationData)(this)
}

export class ClubDeactivatedNotificationData extends Schema.TaggedClass<ClubDeactivatedNotificationData>(
  'ClubDeactivatedNotificationData'
)('ClubDeactivatedNotificationData', {
  clubUuid: ClubUuid,
  reason: Schema.Literal('EXPIRED', 'FLAGGED', 'OTHER'),
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(ClubDeactivatedNotificationData)(this)
}

export class OpenBrowserLinkNotificationData extends Schema.TaggedClass<OpenBrowserLinkNotificationData>(
  'OpenBrowserLinkNotificationData'
)('OpenBrowserLinkNotificationData', {
  url: Schema.String,
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(OpenBrowserLinkNotificationData)(this)
}

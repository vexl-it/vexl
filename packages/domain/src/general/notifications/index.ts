import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {orElseSchema} from '@vexl-next/generic-utils/src/effect-helpers/orElseSchema'
import {Brand, Schema as S, Schema} from 'effect'
import {BooleanFromString} from 'effect/Schema'
import {z} from 'zod'
import {UnixMillisecondsE} from '../../utility/UnixMilliseconds.brand'
import {ClubUuidE} from '../clubs'
import {NotificationTrackingId} from '../NotificationTrackingId.brand'
import {NotificationCypherE} from './NotificationCypher.brand'

export const FcmCypher = z
  .string()
  .includes('.')
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'FcmCypher'>>()(v))

export const FcmCypherE = S.String.pipe(S.brand('FcmCypher'))
export type FcmCypher = S.Schema.Type<typeof FcmCypherE>

export const ChatNotificationType = S.Literal(
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
  'UNKNOWN'
)

export class ChatNotificationData extends S.Class<ChatNotificationData>(
  'NotificationData'
)({
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
  type: ChatNotificationType.pipe(orElseSchema('UNKNOWN')),
  inbox: PublicKeyPemBase64E,
  sender: PublicKeyPemBase64E,
  preview: S.String.pipe(S.optional),
}) {
  static parseUnkownOption = S.decodeUnknownOption(ChatNotificationData)
}

export class NewChatMessageNoticeNotificationData extends S.TaggedClass<NewChatMessageNoticeNotificationData>(
  'NewChatMessageNoticeNotificationData'
)('NewChatMessageNoticeNotificationData', {
  targetCypher: NotificationCypherE,
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
  sentAt: Schema.compose(Schema.NumberFromString, UnixMillisecondsE),
  // Notification payload does not allow booleans
  includesSystemNotification: BooleanFromString,
}) {
  static parseUnkownOption = S.decodeUnknownOption(
    NewChatMessageNoticeNotificationData
  )
}

export class NewClubConnectionNotificationData extends Schema.TaggedClass<NewClubConnectionNotificationData>(
  'NewClubConnectionNotificationData'
)('NewClubConnectionNotificationData', {
  clubUuids: Schema.parseJson(Schema.NonEmptyArray(ClubUuidE)),
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
  sentAt: Schema.compose(Schema.NumberFromString, UnixMillisecondsE),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(NewSocialNetworkConnectionNotificationData)(this)
}

export class AdmitedToClubNetworkNotificationData extends Schema.TaggedClass<AdmitedToClubNetworkNotificationData>(
  'AdmitedToClubNetworkNotificationData'
)('AdmitedToClubNetworkNotificationData', {
  publicKey: PublicKeyPemBase64E,
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(AdmitedToClubNetworkNotificationData)(this)
}

export class ClubDeactivatedNotificationData extends Schema.TaggedClass<ClubDeactivatedNotificationData>(
  'ClubDeactivatedNotificationData'
)('ClubDeactivatedNotificationData', {
  clubUuid: ClubUuidE,
  reason: Schema.Literal('EXPIRED', 'FLAGGED', 'OTHER'),
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(ClubDeactivatedNotificationData)(this)
}

export class OpenBrowserLinkNotificationData extends Schema.TaggedClass<OpenBrowserLinkNotificationData>(
  'OpenBrowserLinkNotificationData'
)('OpenBrowserLinkNotificationData', {
  url: S.String,
  trackingId: Schema.optionalWith(NotificationTrackingId, {as: 'Option'}),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(OpenBrowserLinkNotificationData)(this)
}

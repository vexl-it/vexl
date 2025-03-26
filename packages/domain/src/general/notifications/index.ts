import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {orElseSchema} from '@vexl-next/generic-utils/src/effect-helpers/orElseSchema'
import {Brand, Schema as S, Schema} from 'effect'
import {z} from 'zod'
import {ClubUuid} from '../clubs'
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
  // Notification payload does not allow booleans
  includesSystemNotification: Schema.Union(
    Schema.Literal('true'),
    Schema.Literal('false')
  ),
}) {
  static parseUnkownOption = S.decodeUnknownOption(
    NewChatMessageNoticeNotificationData
  )
}

export class NewClubConnectionNotificationData extends Schema.Class<NewClubConnectionNotificationData>(
  'NewClubConnectionNotificationData'
)({
  clubUuids: Schema.parseJson(Schema.Array(ClubUuid)),
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(NewClubConnectionNotificationData)(this)
}

export class NewSocialNetworkConnectionNotificationData extends Schema.Class<NewSocialNetworkConnectionNotificationData>(
  'NewSocialNetworkConnectionNotificationData'
)({
  type: Schema.Literal('NEW_APP_USER'), // backward compatibility
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(NewSocialNetworkConnectionNotificationData)(this)
}

export class AdmitedToClubNetworkNotificationData extends Schema.Class<AdmitedToClubNetworkNotificationData>(
  'AdmitedToClubNetworkNotificationData'
)({
  publicKey: PublicKeyPemBase64E,
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(AdmitedToClubNetworkNotificationData)(this)
}

export class OpenBrowserLinkNotificationData extends Schema.Class<OpenBrowserLinkNotificationData>(
  'OpenBrowserLinkNotificationData'
)({
  url: S.String,
}) {
  toData = (): Record<string, string> =>
    Schema.encodeSync(OpenBrowserLinkNotificationData)(this)
}

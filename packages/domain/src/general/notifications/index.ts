import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {orElseSchema} from '@vexl-next/generic-utils/src/effect-helpers/orElseSchema'
import {Brand, Schema as S} from 'effect'
import {z} from 'zod'
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
}) {
  static parseUnkownOption = S.decodeUnknownOption(
    NewChatMessageNoticeNotificationData
  )
}

import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {orElseSchema} from '@vexl-next/generic-utils/src/effect-helpers/orElseSchema'
import {Brand, Schema as S} from 'effect'
import {z} from 'zod'

export const FcmCypher = z
  .string()
  .includes('.')
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'FcmCypher'>>()(v))

export const FcmCypherE = S.String.pipe(S.brand('FcmCypher'))
export type FcmCypher = S.Schema.Type<typeof FcmCypherE>

export function extractPublicKeyFromCypher(
  fcmCypher: FcmCypher | undefined
): PublicKeyPemBase64 | undefined {
  if (fcmCypher === undefined) return undefined
  const split = fcmCypher?.split('.')?.at(0)
  if (!split) return undefined

  return S.decodeSync(PublicKeyPemBase64E)(split)
}

export function extractCypherFromFcmCypher(
  fcmCypher: FcmCypher | undefined
): string | undefined {
  if (fcmCypher === undefined) return undefined
  const split = fcmCypher?.split('.')?.at(1)
  if (!split) return undefined

  return split
}

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
  targetCypher: FcmCypherE,
}) {
  static parseUnkownOption = S.decodeUnknownOption(
    NewChatMessageNoticeNotificationData
  )
}

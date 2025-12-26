import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Schema} from 'effect'

export class SystemChatNotificationData extends Schema.TaggedClass<SystemChatNotificationData>(
  'SystemChatNotificationData'
)('SystemChatNotificationData', {
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
}) {
  static encode = Schema.encodeSync(SystemChatNotificationData)
}

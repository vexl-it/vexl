import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Schema} from 'effect'

export class SystemChatNotificationData extends Schema.TaggedClass<SystemChatNotificationData>(
  'SystemChatNotificationData'
)('SystemChatNotificationData', {
  inbox: PublicKeyPemBase64E,
  sender: PublicKeyPemBase64E,
}) {
  static encode = Schema.encodeSync(SystemChatNotificationData)
}

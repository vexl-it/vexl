import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'

export class SystemChatNotificationData extends Schema.TaggedClass<SystemChatNotificationData>(
  'SystemChatNotificationData'
)('SystemChatNotificationData', {
  inbox: PublicKeyPemBase64E,
  sender: PublicKeyPemBase64E,
}) {
  static encode = Schema.encodeSync(SystemChatNotificationData)
}

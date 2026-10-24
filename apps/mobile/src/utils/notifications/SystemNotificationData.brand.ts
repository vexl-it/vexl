import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {MessageType} from '@vexl-next/domain/src/general/messaging'
import {Schema} from 'effect'

export class SystemChatNotificationData extends Schema.TaggedClass<SystemChatNotificationData>(
  'SystemChatNotificationData'
)('SystemChatNotificationData', {
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
  type: Schema.optional(MessageType),
}) {
  static encode = Schema.encodeSync(SystemChatNotificationData)
}

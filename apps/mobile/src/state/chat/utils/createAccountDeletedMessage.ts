import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ChatMessageWithState} from '../domain'
import {generateChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'

export default function createAccountDeletedMessage({
  senderPublicKey,
}: {
  senderPublicKey: PublicKeyPemBase64
}): ChatMessageWithState {
  return {
    state: 'received',
    message: {
      uuid: generateChatMessageId(),
      messageType: 'INBOX_DELETED',
      text: '',
      time: unixMillisecondsNow(),
      senderPublicKey,
    },
  }
}

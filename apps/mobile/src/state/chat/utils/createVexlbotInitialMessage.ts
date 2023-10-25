import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ChatMessageWithState} from '../domain'
import {generateChatMessageId} from '@vexl-next/domain/dist/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'

export default function createVexlbotInitialMessage({
  senderPublicKey,
}: {
  senderPublicKey: PublicKeyPemBase64
}): ChatMessageWithState {
  return {
    state: 'received',
    message: {
      uuid: generateChatMessageId(),
      messageType: 'VEXLBOT_INITIAL_MESSAGE',
      text: '',
      time: unixMillisecondsNow(),
      senderPublicKey,
    },
  }
}

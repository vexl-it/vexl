import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type Chat,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {
  SemverString,
  compare as compareSemver,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Effect, Schema} from 'effect'
import {atom, type Atom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import {sendReadReceiptsAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {type ChatMessageWithState} from '../domain'

const MINIMAL_REQUIRED_VERSION = Schema.decodeSync(SemverString)('1.39.1')

function createMessageReadMessage(
  senderPublicKey: PublicKeyPemBase64
): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    time: now(),
    myVersion: version,
    minimalRequiredVersion: MINIMAL_REQUIRED_VERSION,
    messageType: 'MESSAGE_READ',
    senderPublicKey,
    text: '',
  }
}

export const sendMessageReadActionAtom = atom(
  null,
  (
    get,
    _set,
    {
      chatAtom,
      lastMessageAtom,
    }: {
      chatAtom: Atom<Chat>
      lastMessageAtom: Atom<ChatMessageWithState | undefined>
    }
  ): Effect.Effect<void, unknown, never> => {
    return Effect.gen(function* (_) {
      const sendReadReceipts = get(sendReadReceiptsAtom)
      if (!sendReadReceipts) {
        return
      }
      const chat = get(chatAtom)
      const lastMessage = get(lastMessageAtom)
      const messageToSend = createMessageReadMessage(
        chat.inbox.privateKey.publicKeyPemBase64
      )

      if (lastMessage?.state === 'receivedButRequiresNewerVersion')
        return Effect.void

      if (
        !chat.otherSideVersion ||
        compareSemver(chat.otherSideVersion)('<', MINIMAL_REQUIRED_VERSION)
      )
        return Effect.void

      yield* _(
        sendMessage({
          api: get(apiAtom).chat,
          senderKeypair: chat.inbox.privateKey,
          receiverPublicKey: chat.otherSide.publicKey,
          message: messageToSend,
          notificationApi: get(apiAtom).notification,
          theirNotificationCypher: chat.otherSideFcmCypher,
          otherSideVersion: chat.otherSideVersion,
        })
      )
    }).pipe(
      Effect.catchAll((e) => {
        reportError('warn', new Error('Error while sending MESSAGE_READ'), {e})
        return Effect.void
      })
    )
  }
)

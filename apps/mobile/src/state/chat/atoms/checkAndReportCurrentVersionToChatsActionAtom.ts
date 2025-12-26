import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type Chat,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {mergeToBoolean} from '@vexl-next/generic-utils/src/effect-helpers/mergeToBoolean'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Effect, Schema} from 'effect/index'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {reportErrorE} from '../../../utils/reportError'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'

function createUpdateNoticeChatMessage({
  version,
  senderPublicKey,
  chat,
}: {
  version: SemverString
  senderPublicKey: PublicKeyPemBase64
  chat: Chat
}): ChatMessage {
  return {
    uuid: generateChatMessageId(),
    text: `I have updated to ${version}`,
    messageType: 'VERSION_UPDATE',
    minimalRequiredVersion: Schema.decodeSync(SemverString)('1.13.1'),
    lastReceivedVersion: chat.otherSideVersion,
    time: now(),
    myVersion: version,
    senderPublicKey,
  } satisfies ChatMessage
}

export const sendUpdateNoticeMessageActionAtom = atom(
  null,
  (get, set, chatAtom: FocusAtomType<ChatWithMessages | undefined>) =>
    Effect.gen(function* (_) {
      const chat = get(chatAtom)
      if (!chat) return

      const messageToSend = createUpdateNoticeChatMessage({
        version,
        senderPublicKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
        chat: chat.chat,
      })

      const api = get(apiAtom)
      yield* _(
        sendMessage({
          api: api.chat,
          senderKeypair: chat.chat.inbox.privateKey,
          receiverPublicKey: chat.chat.otherSide.publicKey,
          message: messageToSend,
          notificationApi: api.notification,
          theirNotificationCypher: chat.chat.otherSideFcmCypher,
          otherSideVersion: chat.chat.otherSideVersion,
        })
      )
      set(
        chatAtom,
        addMessageToChat({
          state: 'sent',
          message: messageToSend,
        } satisfies ChatMessageWithState)
      )
    }).pipe(
      Effect.tapError((error) => {
        if (error._tag === 'ReceiverInboxDoesNotExistError') {
          return Effect.void
        }

        console.error('Failed to send version update message')
        return reportErrorE(
          'warn',
          new Error('Failed to send version update message'),
          {error}
        )
      }),
      mergeToBoolean
    )
)

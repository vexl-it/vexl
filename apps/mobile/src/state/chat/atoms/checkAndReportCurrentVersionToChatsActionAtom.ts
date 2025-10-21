import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatMessageId,
  type Chat,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as A from 'fp-ts/Array'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/lib/function'
import {atom, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {apiAtom} from '../../../api'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import reportError from '../../../utils/reportError'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import isChatOpen from '../utils/isChatOpen'
import allChatsAtom from './allChatsAtom'
import focusChatByInboxKeyAndSenderKey from './focusChatByInboxKeyAndSenderKey'

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
    minimalRequiredVersion: SemverString.parse('1.13.1'),
    lastReceivedVersion: chat.otherSideVersion,
    time: now(),
    myVersion: version,
    senderPublicKey,
  } satisfies ChatMessage
}

export const sendUpdateNoticeMessageActionAtom = atom(
  null,
  (get, set, chatAtom: FocusAtomType<ChatWithMessages | undefined>) => {
    const chat = get(chatAtom)
    if (!chat) return T.of(false)

    const messageToSend = createUpdateNoticeChatMessage({
      version,
      senderPublicKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
      chat: chat.chat,
    })

    const api = get(apiAtom)
    return pipe(
      effectToTaskEither(
        sendMessage({
          api: api.chat,
          senderKeypair: chat.chat.inbox.privateKey,
          receiverPublicKey: chat.chat.otherSide.publicKey,
          message: messageToSend,
          notificationApi: api.notification,
          theirNotificationCypher: chat.chat.otherSideFcmCypher,
          otherSideVersion: chat.chat.otherSideVersion,
        })
      ),
      TE.map(() => {
        set(
          chatAtom,
          addMessageToChat({
            state: 'sent',
            message: messageToSend,
          } satisfies ChatMessageWithState)
        )
        return true
      }),
      TE.getOrElse((error) => {
        if (error._tag === 'ReceiverInboxDoesNotExistError') {
          return T.of(false)
        }

        console.error('Failed to send version update message')
        reportError(
          'warn',
          new Error('Failed to send version update message'),
          {error}
        )

        return T.of(false)
      })
    )
  }
)

const checkAndReportCurrentVersionToChatsActionAtom = atom(null, (get, set) => {
  const chatsToSendUpdateInto = get(allChatsAtom)
    .flat()
    .filter(isChatOpen)
    .filter((oneChat) => oneChat.chat.lastReportedVersion !== version)

  if (chatsToSendUpdateInto.length === 0) {
    console.info('There are no chats to send version update into')
  }

  console.info(
    `Sending version update into ${chatsToSendUpdateInto.length} chats`
  )

  void pipe(
    chatsToSendUpdateInto,
    A.map(
      flow(
        (chat) =>
          focusChatByInboxKeyAndSenderKey({
            inboxKey: chat.chat.inbox.privateKey.publicKeyPemBase64,
            senderKey: chat.chat.otherSide.publicKey,
          }),
        (v) => set(sendUpdateNoticeMessageActionAtom, v)
      )
    ),
    T.sequenceArray
  )()
})

export default checkAndReportCurrentVersionToChatsActionAtom

export function useCheckAndReportCurrrentVersionToChatsActionAtom(): void {
  const setCheckAndReportCurrentVersionToChatsAction = useSetAtom(
    checkAndReportCurrentVersionToChatsActionAtom
  )

  useEffect(() => {
    setCheckAndReportCurrentVersionToChatsAction()
  }, [setCheckAndReportCurrentVersionToChatsAction])
}

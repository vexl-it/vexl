import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {Effect} from 'effect'
import {atom, type WritableAtom} from 'jotai'
import {apiAtom} from '../../../api'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {createSingleOfferReportedFlagAtom} from '../../marketplace/atoms/offersState'
import {type ChatWithMessages} from '../domain'

export default function blockChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): WritableAtom<null, [{text: string}], any> {
  return atom(null, (get, set, {text}: {text: string}) => {
    const {chat} = get(chatWithMessagesAtom)
    const api = get(apiAtom)

    const messageToSend: ChatMessage = {
      text,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      myVersion: version,
      messageType: 'BLOCK_CHAT',
      senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
    }

    return Effect.gen(function* (_) {
      yield* _(
        sendMessage({
          api: api.chat,
          senderKeypair: chat.inbox.privateKey,
          receiverPublicKey: chat.otherSide.publicKey,
          message: messageToSend,
          notificationApi: api.notification,
          theirNotificationCypher: chat.otherSideFcmCypher,
          otherSideVersion: chat.otherSideVersion,
        }),
        Effect.catchAll((e) => {
          if (
            e._tag === 'SenderInboxDoesNotExistError' ||
            e._tag === 'ReceiverInboxDoesNotExistError' ||
            e._tag === 'NotPermittedToSendMessageToTargetInboxError'
          ) {
            return Effect.succeed(null)
          }
          return Effect.fail(e)
        })
      )

      yield* _(
        api.chat.blockInbox({
          keyPair: chat.inbox.privateKey,
          publicKeyToBlock: chat.otherSide.publicKey,
        })
      )

      const successMessage = {
        message: messageToSend,
        state: 'sent',
      } as const

      set(chatWithMessagesAtom, (old) => ({
        ...old,
        chat: {
          ...old.chat,
          lastReportedVersion:
            messageToSend.myVersion ?? old.chat.lastReportedVersion,
        },
        messages: [successMessage],
      }))

      if (chat.origin.type === 'theirOffer') {
        set(createSingleOfferReportedFlagAtom(chat.origin.offerId), true)
      }

      return successMessage
    })
  })
}

import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage from '@vexl-next/resources-utils/src/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {type ExtractLeftTE} from '@vexl-next/resources-utils/src/utils/ExtractLeft'
import {type ChatPrivateApi} from '@vexl-next/rest-api/src/services/chat'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {version} from '../../../utils/environment'
import {createSingleOfferReportedFlagAtom} from '../../marketplace/atoms/offersState'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

export default function blockChatActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [{text: string}],
  TE.TaskEither<
    | ErrorEncryptingMessage
    | ExtractLeftTE<ReturnType<ChatPrivateApi['blockInbox']>>
    | ExtractLeftTE<ReturnType<typeof sendMessage>>,
    ChatMessageWithState
  >
> {
  return atom(null, (get, set, {text}) => {
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

    return pipe(
      sendMessage({
        api: api.chat,
        senderKeypair: chat.inbox.privateKey,
        receiverPublicKey: chat.otherSide.publicKey,
        message: messageToSend,
        notificationApi: api.notification,
        theirFcmCypher: chat.otherSideFcmCypher,
        otherSideVersion: chat.otherSideVersion,
      }),
      TE.matchW(
        (e): E.Either<typeof e, null> => {
          if (
            e._tag === 'inboxDoesNotExist' ||
            e._tag === 'notPermittedToSendMessageToTargetInbox'
          ) {
            return E.right(null)
          }

          return E.left(e)
        },
        () => E.right(null)
      ),
      TE.chainW(() =>
        api.chat.blockInbox({
          block: true,
          keyPair: chat.inbox.privateKey,
          publicKeyToBlock: chat.otherSide.publicKey,
        })
      ),
      TE.map((): ChatMessageWithState => {
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
    )
  })
}

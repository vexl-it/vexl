import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  generateChatMessageId,
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import sendMessage, {
  type SendMessageApiErrors,
} from '@vexl-next/resources-utils/src/chat/sendMessage'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import removeFile from '../../../utils/removeFile'
import {tradeChecklistDataAtom} from '../../tradeChecklist/atoms/fromChatAtoms'
import {updateTradeChecklistState} from '../../tradeChecklist/utils'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {addMessageToMessagesArray} from '../utils/addMessageToChat'
import processTradeChecklistContactRevealMessageIfAny from '../utils/processTradeChecklistContactRevealMessageIfAny'
import processTradeChecklistIdentityRevealMessageIfAny from '../utils/processTradeChecklistIdentityRevealMessageIfAny'
import {replaceIdentityImageFileUriWithBase64} from '../utils/replaceImageFileUrisWithBase64'

export default function createSubmitChecklistUpdateActionAtom(
  chatWithMessagesAtom: FocusAtomType<ChatWithMessages>
): ActionAtomType<
  [TradeChecklistUpdate],
  TE.TaskEither<
    | SendMessageApiErrors
    | ErrorEncryptingMessage
    | JsonStringifyError
    | ZodParseError<ChatMessagePayload>,
    ChatMessageWithState
  >
> {
  return atom(null, (get, set, update: TradeChecklistUpdate) => {
    const api = get(privateApiAtom)
    const chatWithMessages = get(chatWithMessagesAtom)
    const tradeChecklistData = get(tradeChecklistDataAtom)

    return pipe(
      T.Do,
      T.chain(() => replaceIdentityImageFileUriWithBase64(update.identity)),
      T.map(
        (identityUpdate) =>
          ({
            text: 'Checklist updated',
            messageType: 'TRADE_CHECKLIST_UPDATE',
            tradeChecklistUpdate: {
              ...update,
              identity: identityUpdate,
            },
            time: unixMillisecondsNow(),
            uuid: generateChatMessageId(),
            senderPublicKey: chatWithMessages.chat.otherSide.publicKey,
          }) as ChatMessage
      ),
      TE.fromTask,
      TE.chainFirstW((message) => {
        return sendMessage({
          api: api.chat,
          senderKeypair: chatWithMessages.chat.inbox.privateKey,
          receiverPublicKey: chatWithMessages.chat.otherSide.publicKey,
          message,
        })
      }),
      TE.map((message): ChatMessageWithState => {
        const successMessage: ChatMessageWithState = {
          message: {
            ...message,
            tradeChecklistUpdate: update,
          },
          state: 'sent',
        }

        if (
          update.identity?.status === 'DISAPPROVE_REVEAL' &&
          tradeChecklistData.identity.received?.image
        ) {
          void removeFile(tradeChecklistData.identity.received.image)()
        }

        const realLifeInfo = (
          update.identity?.status === 'APPROVE_REVEAL'
            ? processTradeChecklistIdentityRevealMessageIfAny(
                tradeChecklistData.identity.received
              )
            : update.contact?.status === 'APPROVE_REVEAL'
            ? processTradeChecklistContactRevealMessageIfAny(
                tradeChecklistData.contact.received,
                chatWithMessages.chat.otherSide.realLifeInfo
              )
            : undefined
        ) satisfies RealLifeInfo | undefined

        set(
          chatWithMessagesAtom,
          (old) =>
            ({
              ...old,
              chat: {
                ...old.chat,
                otherSide: {
                  ...old.chat.otherSide,
                  realLifeInfo: realLifeInfo ?? old.chat.otherSide.realLifeInfo,
                },
              },
              tradeChecklist: updateTradeChecklistState(old.tradeChecklist)({
                update,
                direction: 'sent',
              }),
              messages: addMessageToMessagesArray(old.messages)(successMessage),
            }) satisfies ChatWithMessages
        )

        return successMessage
      })
    )
  })
}

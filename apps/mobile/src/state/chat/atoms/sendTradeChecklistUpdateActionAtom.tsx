import {atom} from 'jotai'
import {type TradeChecklistUpdate} from '@vexl-next/domain/src/general/tradeChecklist'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {
  type ChatMessage,
  generateChatMessageId,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {pipe} from 'fp-ts/function'
import sendMessage, {
  type SendMessageApiErrors,
} from '@vexl-next/resources-utils/src/chat/sendMessage'
import {privateApiAtom} from '../../../api'
import {updateTradeChecklistState} from '../../tradeChecklist/utils'
import {addMessageToMessagesArray} from '../utils/addMessageToChat'
import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import * as TE from 'fp-ts/TaskEither'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'

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

    const chatMessage: ChatMessage = {
      text: 'Checklist updated',
      messageType: 'TRADE_CHECKLIST_UPDATE',
      tradeChecklistUpdate: update,
      time: unixMillisecondsNow(),
      uuid: generateChatMessageId(),
      senderPublicKey: chatWithMessages.chat.otherSide.publicKey,
    }

    return pipe(
      sendMessage({
        api: api.chat,
        senderKeypair: chatWithMessages.chat.inbox.privateKey,
        receiverPublicKey: chatWithMessages.chat.otherSide.publicKey,
        message: chatMessage,
      }),
      TE.map((): ChatMessageWithState => {
        const successMessage: ChatMessageWithState = {
          message: chatMessage,
          state: 'sent',
        }
        set(chatWithMessagesAtom, (old) => ({
          ...old,
          tradeChecklist: updateTradeChecklistState(old.tradeChecklist)({
            update,
            direction: 'sent',
          }),
          messages: addMessageToMessagesArray(old.messages)(successMessage),
        }))
        return successMessage
      })
    )
  })
}

import {type ActionAtomType} from '../../../utils/atomUtils/ActionAtomType'
import * as TE from 'fp-ts/TaskEither'
import confirmMessagingRequest, {
  type ApiConfirmMessagingRequest,
} from '@vexl-next/resources-utils/dist/chat/confirmMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/dist/chat/utils/chatCrypto'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import {atom, type PrimitiveAtom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {pipe} from 'fp-ts/function'
import addMessageToChat from '../utils/addMessageToChat'

type AcceptMessagingRequestAtom = ActionAtomType<
  [
    {
      chatAtom: PrimitiveAtom<ChatWithMessages>
      approve: boolean
      text: string
    }
  ],
  TE.TaskEither<
    ApiConfirmMessagingRequest | ErrorEncryptingMessage,
    ChatMessageWithState
  >
>

const acceptMessagingRequestAtom: AcceptMessagingRequestAtom = atom(
  null,
  (get, set, {chatAtom, approve, text}) => {
    const api = get(privateApiAtom)
    const {chat} = get(chatAtom)

    return pipe(
      confirmMessagingRequest({
        text,
        approve,
        api: api.chat,
        fromKeypair: chat.inbox.privateKey,
        toPublicKey: chat.otherSide.publicKey,
      }),
      TE.map((message): ChatMessageWithState => ({state: 'sent', message})),
      TE.map((message) => {
        set(chatAtom, addMessageToChat(message))
        return message
      })
    )
  }
)
export default acceptMessagingRequestAtom

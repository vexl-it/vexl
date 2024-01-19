import {type ChatMessagePayload} from '@vexl-next/domain/src/general/messaging'
import confirmMessagingRequest, {
  type ApiConfirmMessagingRequest,
} from '@vexl-next/resources-utils/src/chat/confirmMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, type PrimitiveAtom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import createAccountDeletedMessage from '../utils/createAccountDeletedMessage'

const acceptMessagingRequestAtom = atom(
  null,
  (
    get,
    set,
    {
      chatAtom,
      approve,
      text,
    }: {
      chatAtom: PrimitiveAtom<ChatWithMessages>
      approve: boolean
      text: string
    }
  ): TE.TaskEither<
    | ApiConfirmMessagingRequest
    | JsonStringifyError
    | ZodParseError<ChatMessagePayload>
    | ErrorEncryptingMessage,
    ChatMessageWithState
  > => {
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
      TE.mapLeft((error) => {
        if (error._tag === 'OtherSideAccountDeleted') {
          set(
            chatAtom,
            addMessageToChat(
              createAccountDeletedMessage({
                senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
              })
            )
          )
        }

        return error
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

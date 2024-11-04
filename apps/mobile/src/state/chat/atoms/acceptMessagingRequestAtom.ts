import {
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import confirmMessagingRequest, {
  type ApiConfirmMessagingRequest,
} from '@vexl-next/resources-utils/src/chat/confirmMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {atom, type PrimitiveAtom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import createAccountDeletedMessage from '../utils/createAccountDeletedMessage'
import {resetTradeChecklist} from '../utils/resetData'
import generateMyFcmTokenInfoActionAtom, {
  updateMyFcmTokenInfoInChat,
} from './generateMyFcmTokenInfoActionAtom'

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
    const api = get(apiAtom)
    const {chat} = get(chatAtom)

    return pipe(
      TE.Do,
      TE.chainTaskK(() =>
        set(generateMyFcmTokenInfoActionAtom, undefined, chat.inbox.privateKey)
      ),
      TE.bindTo('myFcmCypher'),
      TE.bindW('configMessage', ({myFcmCypher}) =>
        effectToTaskEither(
          confirmMessagingRequest({
            text,
            approve,
            api: api.chat,
            theirFcmCypher: chat.otherSideFcmCypher,
            notificationApi: api.notification,
            fromKeypair: chat.inbox.privateKey,
            toPublicKey: chat.otherSide.publicKey,
            myVersion: version,
            myFcmCypher:
              myFcmCypher._tag === 'Some'
                ? myFcmCypher.value.cypher
                : undefined,
            lastReceivedFcmCypher: chat.otherSideFcmCypher,
            otherSideVersion: chat.otherSideVersion,
          })
        )
      ),
      TE.mapLeft((error) => {
        if (error._tag === 'ReceiverInboxDoesNotExistError') {
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
      TE.bind('message', ({configMessage: message}) =>
        TE.of({
          state: 'sent' as const,
          message: message satisfies ChatMessage,
        } satisfies ChatMessageWithState)
      ),
      TE.map(({message, myFcmCypher}) => {
        set(
          chatAtom,
          flow(
            addMessageToChat(message),
            // Make sure to reset checklist. If they open chat again after rerequest, we don't want to show the checklist again
            resetTradeChecklist,
            // resetRealLifeInfo,
            updateMyFcmTokenInfoInChat(O.toUndefined(myFcmCypher))
          )
        )
        return message
      })
    )
  }
)
export default acceptMessagingRequestAtom

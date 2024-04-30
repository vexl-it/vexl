import {type ChatMessagePayload} from '@vexl-next/domain/src/general/messaging'
import confirmMessagingRequest, {
  type ApiConfirmMessagingRequest,
} from '@vexl-next/resources-utils/src/chat/confirmMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {atom, type PrimitiveAtom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import createAccountDeletedMessage from '../utils/createAccountDeletedMessage'
import {resetRealLifeInfo, resetTradeChecklist} from '../utils/resetData'
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
    const api = get(privateApiAtom)
    const {chat} = get(chatAtom)

    return pipe(
      TE.Do,
      TE.chainTaskK(() => set(generateMyFcmTokenInfoActionAtom)),
      TE.bindTo('myFcmCypher'),
      TE.bindW('configmMessage', ({myFcmCypher}) =>
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
            myFcmCypher._tag === 'Some' ? myFcmCypher.value.cypher : undefined,
          lastReceivedFcmCypher: chat.otherSideFcmCypher,
          otherSideVersion: chat.otherSideVersion,
        })
      ),
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
      TE.bind('message', ({configmMessage: message}) =>
        TE.of({
          state: 'sent',
          message,
        } satisfies ChatMessageWithState)
      ),
      TE.map(({message, myFcmCypher}) => {
        set(
          chatAtom,
          flow(
            addMessageToChat(message),
            // Make sure to reset checklist. If they open chat again after rerequest, we don't want to show the checklist again
            resetTradeChecklist,
            resetRealLifeInfo,
            updateMyFcmTokenInfoInChat(O.toUndefined(myFcmCypher))
          )
        )
        return message
      })
    )
  }
)
export default acceptMessagingRequestAtom

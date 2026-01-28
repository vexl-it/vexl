import {type HttpApiDecodeError} from '@effect/platform/HttpApiError'
import {type HttpClientError} from '@effect/platform/index'
import {
  type NotFoundError,
  type RateLimitedError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'
import confirmMessagingRequest, {
  type ApiConfirmMessagingRequest,
} from '@vexl-next/resources-utils/src/chat/confirmMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {type JsonStringifyError} from '@vexl-next/resources-utils/src/utils/parsing'
import {type ParseResult} from 'effect/index'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {atom, type PrimitiveAtom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import {type NoVexlSecretError} from '../../notifications/actions/NoVexlSecretError'
import {generateAndRegisterVexlTokenActionAtom} from '../../notifications/actions/generateVexlTokenActionAtom'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import createAccountDeletedMessage from '../utils/createAccountDeletedMessage'
import {resetTradeChecklist} from '../utils/resetData'
import {updateMyNotificationTokenInfoInChat} from './generateMyNotificationTokenInfoActionAtom'

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
    | ParseResult.ParseError
    | HttpApiDecodeError
    | RateLimitedError
    | UnexpectedServerError
    | NotFoundError
    | HttpClientError.HttpClientError
    | NoVexlSecretError
    | ErrorEncryptingMessage,
    ChatMessageWithState
  > => {
    const api = get(apiAtom)
    const {chat} = get(chatAtom)

    return pipe(
      TE.Do,
      TE.chainW(() =>
        effectToTaskEither(
          set(generateAndRegisterVexlTokenActionAtom, {
            keyHolder: chat.inbox.privateKey,
          })
        )
      ),
      TE.bindTo('vexlToken'),
      TE.bindW('configMessage', ({vexlToken}) =>
        effectToTaskEither(
          confirmMessagingRequest({
            text,
            approve,
            api: api.chat,
            theirNotificationCypher:
              chat.otherSideVexlToken ?? chat.otherSideFcmCypher,
            notificationApi: api.notification,
            fromKeypair: chat.inbox.privateKey,
            toPublicKey: chat.otherSide.publicKey,
            myVersion: version,
            myNotificationCypher: vexlToken,
            lastReceivedNotificationCypher:
              chat.otherSideVexlToken ?? chat.otherSideFcmCypher,
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
      TE.map(({message, vexlToken}) => {
        set(
          chatAtom,
          flow(
            addMessageToChat(message),
            // Make sure to reset checklist. If they open chat again after rerequest, we don't want to show the checklist again
            resetTradeChecklist,
            // resetRealLifeInfo,
            updateMyNotificationTokenInfoInChat(vexlToken)
          )
        )
        return message
      })
    )
  }
)
export default acceptMessagingRequestAtom

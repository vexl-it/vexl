import {
  type ChatMessage,
  type ChatMessagePayload,
} from '@vexl-next/domain/src/general/messaging'
import confirmMessagingRequest, {
  type ApiConfirmMessagingRequest,
} from '@vexl-next/resources-utils/src/chat/confirmMessagingRequest'
import {type ErrorEncryptingMessage} from '@vexl-next/resources-utils/src/chat/utils/chatCrypto'
import {
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import {Effect, Option, flow} from 'effect'
import {atom, type PrimitiveAtom} from 'jotai'
import {apiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'
import addMessageToChat from '../utils/addMessageToChat'
import createAccountDeletedMessage from '../utils/createAccountDeletedMessage'
import {resetTradeChecklist} from '../utils/resetData'
import {
  generateMyNotificationTokenInfoActionAtom,
  updateMyNotificationTokenInfoInChat,
} from './generateMyNotificationTokenInfoActionAtom'

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
  ): Effect.Effect<
    ChatMessageWithState,
    | ApiConfirmMessagingRequest
    | JsonStringifyError
    | ZodParseError<ChatMessagePayload>
    | ErrorEncryptingMessage
  > => {
    const api = get(apiAtom)
    const {chat} = get(chatAtom)

    return Effect.gen(function* (_) {
      const myFcmCypher = yield* _(
        set(
          generateMyNotificationTokenInfoActionAtom,
          undefined,
          chat.inbox.privateKey
        )
      )

      const configMessage = yield* _(
        confirmMessagingRequest({
          text,
          approve,
          api: api.chat,
          theirNotificationCypher: chat.otherSideFcmCypher,
          notificationApi: api.notification,
          fromKeypair: chat.inbox.privateKey,
          toPublicKey: chat.otherSide.publicKey,
          myVersion: version,
          myNotificationCypher: Option.isSome(myFcmCypher)
            ? myFcmCypher.value.cypher
            : undefined,
          lastReceivedNotificationCypher: chat.otherSideFcmCypher,
          otherSideVersion: chat.otherSideVersion,
        }),
        Effect.tapError((error) =>
          Effect.sync(() => {
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
          })
        )
      )

      const message = {
        state: 'sent' as const,
        message: configMessage satisfies ChatMessage,
      } satisfies ChatMessageWithState

      set(
        chatAtom,
        flow(
          addMessageToChat(message),
          // Make sure to reset checklist. If they open chat again after rerequest, we don't want to show the checklist again
          resetTradeChecklist,
          // resetRealLifeInfo,
          updateMyNotificationTokenInfoInChat(
            Option.getOrUndefined(myFcmCypher)
          )
        )
      )

      return message
    })
  }
)
export default acceptMessagingRequestAtom

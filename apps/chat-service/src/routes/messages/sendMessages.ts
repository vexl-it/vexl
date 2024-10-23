import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type MessageInBatch,
  type ReceiverOfferInboxDoesNotExistError,
  type SendMessageResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  SendMessageErrors,
  SendMessagesEndpoint,
} from '@vexl-next/rest-api/src/services/chat/specification'
import {type NotPermittedToSendMessageToTargetInboxError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, type ConfigError, Effect, pipe} from 'effect'
import {Handler} from 'effect-http'
import {type InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {type WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey} from '../../db/domain'
import {findAndEnsureReceiverInbox} from '../../utils/findAndEnsureReceiverInbox'
import {ensureSenderInReceiverWhitelist} from '../../utils/isSenderInReceiverWhitelist'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'

const sendMessage = (
  senderPublicKey: PublicKeyPemBase64,
  message: MessageInBatch
): Effect.Effect<
  SendMessageResponse,
  | ReceiverOfferInboxDoesNotExistError
  | UnexpectedServerError
  | NotPermittedToSendMessageToTargetInboxError
  | ConfigError.ConfigError,
  WhitelistDbService | MessagesDbService | InboxDbService | ServerCrypto
> =>
  Effect.gen(function* (_) {
    const receiverInbox = yield* _(
      findAndEnsureReceiverInbox(message.receiverPublicKey)
    )

    yield* _(
      ensureSenderInReceiverWhitelist({
        receiver: receiverInbox.id,
        sender: senderPublicKey,
      })
    )

    const messagesDb = yield* _(MessagesDbService)
    const messageRecord = yield* _(
      messagesDb.insertMessageForInbox({
        message: message.message,
        senderPublicKey: yield* _(encryptPublicKey(senderPublicKey)),
        inboxId: receiverInbox.id,
        type: message.messageType,
      })
    )

    return {
      id: Number(messageRecord.id),
      message: messageRecord.message,
      senderPublicKey,
      notificationHandled: false,
    } satisfies SendMessageResponse
  }) // TODO lock two inboxes

export const sendMessages = Handler.make(SendMessagesEndpoint, (req) =>
  makeEndpointEffect(
    pipe(
      req.body.data,
      Array.map((oneMessage) =>
        Effect.gen(function* (_) {
          yield* _(
            validateChallengeInBody({
              publicKey: oneMessage.senderPublicKey,
              ...oneMessage,
            })
          )

          const result = yield* _(
            oneMessage.messages,
            Array.map((message) =>
              sendMessage(oneMessage.senderPublicKey, message)
            ),
            Effect.all
          )
          return result
        })
      ),
      Effect.all,
      Effect.map(Array.flatten)
    ),
    SendMessageErrors
  ).pipe(withDbTransaction)
)

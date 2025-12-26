import {HttpApiBuilder} from '@effect/platform/index'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  SenderInboxDoesNotExistError,
  type MessageInBatch,
  type ReceiverInboxDoesNotExistError,
  type SendMessageResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {
  ForbiddenMessageTyperror,
  type NotPermittedToSendMessageToTargetInboxError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {
  type RedisLockError,
  type RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, pipe, type ConfigError} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {type WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey, hashPublicKey} from '../../db/domain'
import {reportMessageSent} from '../../metrics'
import {findAndEnsureReceiverInbox} from '../../utils/findAndEnsureReceiverInbox'
import {forbiddenMessageTypes} from '../../utils/forbiddenMessageTypes'
import {ensureSenderInReceiverWhitelist} from '../../utils/isSenderInReceiverWhitelist'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

const sendMessage = (
  senderPublicKey: PublicKeyPemBase64,
  message: MessageInBatch
): Effect.Effect<
  SendMessageResponse,
  | ReceiverInboxDoesNotExistError
  | UnexpectedServerError
  | NotPermittedToSendMessageToTargetInboxError
  | ConfigError.ConfigError
  | RedisLockError
  | ForbiddenMessageTyperror,
  | WhitelistDbService
  | MessagesDbService
  | InboxDbService
  | ServerCrypto
  | RedisService
  | MetricsClientService
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

    if (forbiddenMessageTypes.includes(message.messageType)) {
      return yield* _(Effect.fail(new ForbiddenMessageTyperror()))
    }

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
  }).pipe(
    withInboxActionRedisLock(message.receiverPublicKey),
    Effect.zipLeft(reportMessageSent(1))
  ) // TODO lock two inboxes

export const sendMessages = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Messages',
  'sendMessages',
  (req) =>
    pipe(
      req.payload.data,
      Array.map((oneMessage) =>
        Effect.gen(function* (_) {
          yield* _(
            validateChallengeInBody({
              publicKey: oneMessage.senderPublicKey,
              ...oneMessage,
            })
          )

          const inboxDb = yield* _(InboxDbService)
          const hashedSenderKey = yield* _(
            hashPublicKey(oneMessage.senderPublicKey)
          )
          yield* _(
            inboxDb.findInboxByPublicKey(hashedSenderKey),
            Effect.flatten,
            Effect.catchTag(
              'NoSuchElementException',
              () => new SenderInboxDoesNotExistError()
            )
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
      Effect.map(Array.flatten),
      withDbTransaction,
      makeEndpointEffect
    )
)

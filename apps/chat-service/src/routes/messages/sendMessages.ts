import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  SenderInboxDoesNotExistError,
  type MessageInBatch,
  type ReceiverInboxDoesNotExistError,
  type SendMessageResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {ForbiddenMessageTyperror} from '@vexl-next/rest-api/src/services/contact/contracts'
import {
  type RedisLockError,
  type RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {
  commonMetricAttributesFromHeaders,
  type CommonMetricAttributes,
} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option, pipe, type Config} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey, hashPublicKey} from '../../db/domain'
import {
  reportMessageSent,
  reportRequestMetricsByMessageType,
} from '../../metrics'
import {findAndEnsureReceiverInbox} from '../../utils/findAndEnsureReceiverInbox'
import {forbiddenMessageTypes} from '../../utils/forbiddenMessageTypes'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'
import {messageRecordToServerMessage} from './messageRecordToServerMessage'

const sendMessage = (
  senderPublicKey: PublicKeyPemBase64,
  message: MessageInBatch,
  commonMetricAttributes: CommonMetricAttributes
): Effect.Effect<
  SendMessageResponse,
  | ReceiverInboxDoesNotExistError
  | UnexpectedServerError
  | Config.ConfigError
  | RedisLockError
  | ForbiddenMessageTyperror,
  | MessagesDbService
  | InboxDbService
  | ServerCrypto
  | RedisService
  | MetricsClientService
> =>
  Effect.gen(function* () {
    const receiverInbox = yield* findAndEnsureReceiverInbox(
      message.receiverPublicKey
    )

    if (forbiddenMessageTypes.includes(message.messageType)) {
      return yield* Effect.fail(new ForbiddenMessageTyperror())
    }

    const messagesDb = yield* MessagesDbService
    const messageRecord = yield* messagesDb.insertMessageForInbox({
      message: message.message,
      senderPublicKey: yield* encryptPublicKey(senderPublicKey),
      inboxId: receiverInbox.id,
      type: message.messageType,
    })

    return {
      ...messageRecordToServerMessage({messageRecord, senderPublicKey}),
      notificationHandled: false,
    } satisfies SendMessageResponse
  }).pipe(
    withInboxActionRedisLock(message.receiverPublicKey),
    Effect.tap(
      Effect.all([
        reportMessageSent(1, commonMetricAttributes),
        reportRequestMetricsByMessageType(
          message.messageType,
          commonMetricAttributes
        ),
      ])
    )
  ) // TODO lock two inboxes

export const sendMessages = makeHttpApiHandler(
  ChatApiSpecification,
  'Messages',
  'sendMessages',
  (req) =>
    pipe(
      req.payload.data,
      Array.map((oneMessage) =>
        Effect.gen(function* () {
          yield* validateChallengeInBody({
            publicKey: oneMessage.senderPublicKey,
            publicKeyV2: Option.none(),
            ...oneMessage,
          })

          const inboxDb = yield* InboxDbService
          const hashedSenderKey = yield* hashPublicKey(
            oneMessage.senderPublicKey
          )
          yield* pipe(
            inboxDb.findInboxByPublicKey(hashedSenderKey),
            Effect.flatMap(Effect.fromOption),
            Effect.catchTag(
              'NoSuchElementError',
              () => new SenderInboxDoesNotExistError()
            )
          )

          const result = yield* pipe(
            oneMessage.messages,
            Array.map((message) =>
              sendMessage(
                oneMessage.senderPublicKey,
                message,
                commonMetricAttributesFromHeaders(req.headers)
              )
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

import {type SendMessageResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {ForbiddenMessageTyperror} from '@vexl-next/rest-api/src/services/contact/contracts'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey} from '../../db/domain'
import {
  reportMessageSent,
  reportRequestMetricsByMessageType,
} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {forbiddenMessageTypes} from '../../utils/forbiddenMessageTypes'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'
import {messageRecordToServerMessage} from './messageRecordToServerMessage'

export const sendMessage = makeHttpApiHandler(
  ChatApiSpecification,
  'Messages',
  'sendMessage',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody({
        publicKey: req.payload.senderPublicKey,
        publicKeyV2: Option.none(),
        signedChallenge: req.payload.signedChallenge,
      })

      if (forbiddenMessageTypes.includes(req.payload.messageType)) {
        return yield* Effect.fail(new ForbiddenMessageTyperror())
      }

      const {receiverInbox} = yield* findAndEnsureReceiverAndSenderInbox({
        sender: req.payload.senderPublicKey,
        receiver: req.payload.receiverPublicKey,
      })

      const messagesDb = yield* MessagesDbService
      const messageRecord = yield* messagesDb.insertMessageForInbox({
        message: req.payload.message,
        senderPublicKey: yield* encryptPublicKey(req.payload.senderPublicKey),
        inboxId: receiverInbox.id,
        type: req.payload.messageType,
      })

      return {
        ...messageRecordToServerMessage({
          messageRecord,
          senderPublicKey: req.payload.senderPublicKey,
        }),
        notificationHandled: false,
      } satisfies SendMessageResponse
    }).pipe(
      withInboxActionRedisLock(req.payload.receiverPublicKey),
      withDbTransaction,
      Effect.tap(
        Effect.all([
          reportMessageSent(1, commonMetricAttributesFromHeaders(req.headers)),
          reportRequestMetricsByMessageType(
            req.payload.messageType,
            commonMetricAttributesFromHeaders(req.headers)
          ),
        ])
      ),
      makeEndpointEffect
    )
)

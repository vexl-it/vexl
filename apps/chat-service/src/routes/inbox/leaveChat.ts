import {HttpApiBuilder} from '@effect/platform/index'
import {type CancelApprovalResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportChatClosed, reportMessageSent} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'
import {messageRecordToServerMessage} from '../messages/messageRecordToServerMessage'

export const leaveChat = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'leaveChat',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(
        validateChallengeInBody({
          signedChallenge: req.payload.signedChallenge,
          publicKey: req.payload.senderPublicKey,
          publicKeyV2: Option.none(),
        })
      )

      const {receiverInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          sender: req.payload.senderPublicKey,
          receiver: req.payload.receiverPublicKey,
        })
      )

      const senderKeyEncrypted = yield* _(
        encryptPublicKey(req.payload.senderPublicKey)
      )
      const messagesDb = yield* _(MessagesDbService)
      const sentMessage = yield* _(
        messagesDb.insertMessageForInbox({
          message: req.payload.message,
          inboxId: receiverInbox.id,
          senderPublicKey: senderKeyEncrypted,
          type: 'DELETE_CHAT',
        })
      )
      const commonMetricAttributes = commonMetricAttributesFromHeaders(
        req.headers
      )
      yield* _(reportMessageSent(1, commonMetricAttributes))
      yield* _(reportChatClosed(1, commonMetricAttributes))

      return {
        ...messageRecordToServerMessage({
          messageRecord: sentMessage,
          senderPublicKey: req.payload.senderPublicKey,
        }),
        notificationHandled: false,
      } satisfies CancelApprovalResponse
    }).pipe(
      withInboxActionRedisLock(
        req.payload.senderPublicKey,
        req.payload.receiverPublicKey
      ),
      withDbTransaction,
      makeEndpointEffect
    )
)

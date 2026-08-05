import {HttpApiBuilder} from '@effect/platform/index'
import {type ApproveRequestResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey} from '../../db/domain'
import {
  reportMessageSent,
  reportRequestApproved,
  reportRequestRejected,
} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'
import {messageRecordToServerMessage} from '../messages/messageRecordToServerMessage'

export const approveRequest = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'approveRequest',
  (req) =>
    Effect.gen(function* (_) {
      const commonMetricAttributes = commonMetricAttributesFromHeaders(
        req.headers
      )
      yield* _(validateChallengeInBody(req.payload))

      // from the point of view of the one that sent the request
      const {senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.payload.publicKey,
          sender: req.payload.publicKeyToConfirm,
        })
      )

      const messagesDb = yield* _(MessagesDbService)
      if (req.payload.approve) {
        yield* _(reportRequestApproved(1, commonMetricAttributes))
      } else {
        yield* _(reportRequestRejected(0, commonMetricAttributes))
      }

      const encryptedSenderPublicKey = yield* _(
        encryptPublicKey(req.payload.publicKey)
      )

      const sentMessage = yield* _(
        messagesDb.insertMessageForInbox({
          inboxId: senderInbox.id,
          senderPublicKey: encryptedSenderPublicKey,
          message: req.payload.message,
          type: req.payload.approve
            ? 'APPROVE_MESSAGING'
            : 'DISAPPROVE_MESSAGING',
        })
      )

      return {
        ...messageRecordToServerMessage({
          messageRecord: sentMessage,
          senderPublicKey: req.payload.publicKey,
        }),
        notificationHandled: false,
      } satisfies ApproveRequestResponse
    }).pipe(
      withInboxActionRedisLock(
        req.payload.publicKey,
        req.payload.publicKeyToConfirm
      ),
      withDbTransaction,
      Effect.zipLeft(
        reportMessageSent(1, commonMetricAttributesFromHeaders(req.headers))
      ),
      makeEndpointEffect
    )
)

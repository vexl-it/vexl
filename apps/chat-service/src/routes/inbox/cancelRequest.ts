import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {type CancelApprovalResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportMessageSent, reportRequestCanceled} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'
import {messageRecordToServerMessage} from '../messages/messageRecordToServerMessage'

export const cancelRequest = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'cancelRequestApproval',
  (req) =>
    Effect.gen(function* (_) {
      const commonMetricAttributes = commonMetricAttributesFromHeaders(
        req.headers
      )
      const security = yield* _(CurrentSecurity)

      const {receiverInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.payload.publicKey,
          sender: security.publicKey,
        })
      )

      const senderPublicKey = yield* _(encryptPublicKey(security.publicKey))

      const messagesDb = yield* _(MessagesDbService)
      const sentMessage = yield* _(
        messagesDb.insertMessageForInbox({
          message: req.payload.message,
          inboxId: receiverInbox.id,
          senderPublicKey,
          type: 'CANCEL_REQUEST_MESSAGING',
        })
      )

      yield* _(reportMessageSent(1, commonMetricAttributes))
      yield* _(reportRequestCanceled(1, commonMetricAttributes))

      return {
        ...messageRecordToServerMessage({
          messageRecord: sentMessage,
          senderPublicKey: security.publicKey,
        }),
        notificationHandled: false,
      } satisfies CancelApprovalResponse
    }).pipe(
      withInboxActionRedisLock(
        Effect.gen(function* (_) {
          const security = yield* _(CurrentSecurity)
          return security.publicKey
        }),
        req.payload.publicKey
      ),
      withDbTransaction,
      makeEndpointEffect
    )
)

export const cancelRequestV2 = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'cancelRequestApprovalV2',
  (req) =>
    Effect.gen(function* (_) {
      const commonMetricAttributes = commonMetricAttributesFromHeaders(
        req.headers
      )
      yield* _(validateChallengeInBody(req.payload))

      const {receiverInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.payload.receiverPublicKey,
          sender: req.payload.publicKey,
        })
      )

      const senderPublicKey = yield* _(encryptPublicKey(req.payload.publicKey))

      const messagesDb = yield* _(MessagesDbService)
      const sentMessage = yield* _(
        messagesDb.insertMessageForInbox({
          message: req.payload.message,
          inboxId: receiverInbox.id,
          senderPublicKey,
          type: 'CANCEL_REQUEST_MESSAGING',
        })
      )

      yield* _(reportMessageSent(1, commonMetricAttributes))
      yield* _(reportRequestCanceled(1, commonMetricAttributes))

      return {
        ...messageRecordToServerMessage({
          messageRecord: sentMessage,
          senderPublicKey: req.payload.publicKey,
        }),
        notificationHandled: false,
      } satisfies CancelApprovalResponse
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

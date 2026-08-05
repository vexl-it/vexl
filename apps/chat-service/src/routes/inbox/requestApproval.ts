import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {type RequestApprovalResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportMessageSent, reportRequestSent} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {
  withInboxActionFromSecurityRedisLock,
  withInboxActionRedisLock,
} from '../../utils/withInboxActionRedisLock'
import {messageRecordToServerMessage} from '../messages/messageRecordToServerMessage'

export const requestApproval = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'requestApproval',
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

      const encryptedSenderKey = yield* _(encryptPublicKey(security.publicKey))
      const messagesDb = yield* _(MessagesDbService)
      const insertedMessage = yield* _(
        messagesDb.insertMessageForInbox({
          inboxId: receiverInbox.id,
          message: req.payload.message,
          senderPublicKey: encryptedSenderKey,
          type: 'REQUEST_MESSAGING',
        })
      )

      yield* _(reportMessageSent(1, commonMetricAttributes))
      yield* _(reportRequestSent(1, commonMetricAttributes))

      return {
        ...messageRecordToServerMessage({
          messageRecord: insertedMessage,
          senderPublicKey: security.publicKey,
        }),
        notificationHandled: false,
      } satisfies RequestApprovalResponse
    }).pipe(
      withInboxActionFromSecurityRedisLock(),
      withDbTransaction,
      makeEndpointEffect
    )
)

export const requestApprovalV2 = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'requestApprovalV2',
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

      const encryptedSenderKey = yield* _(
        encryptPublicKey(req.payload.publicKey)
      )
      const messagesDb = yield* _(MessagesDbService)
      const insertedMessage = yield* _(
        messagesDb.insertMessageForInbox({
          inboxId: receiverInbox.id,
          message: req.payload.message,
          senderPublicKey: encryptedSenderKey,
          type: 'REQUEST_MESSAGING',
        })
      )

      yield* _(reportMessageSent(1, commonMetricAttributes))
      yield* _(reportRequestSent(1, commonMetricAttributes))

      return {
        ...messageRecordToServerMessage({
          messageRecord: insertedMessage,
          senderPublicKey: req.payload.publicKey,
        }),
        notificationHandled: false,
      } satisfies RequestApprovalResponse
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

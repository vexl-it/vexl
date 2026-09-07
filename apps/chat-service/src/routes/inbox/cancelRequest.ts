import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {type CancelApprovalResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
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

export const cancelRequest = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'cancelRequestApproval',
  (req) =>
    Effect.gen(function* () {
      const commonMetricAttributes = commonMetricAttributesFromHeaders(
        req.headers
      )
      const security = yield* CurrentSecurity

      const {receiverInbox} = yield* findAndEnsureReceiverAndSenderInbox({
        receiver: req.payload.publicKey,
        sender: security.publicKey,
      })

      const senderPublicKey = yield* encryptPublicKey(security.publicKey)

      const messagesDb = yield* MessagesDbService
      const sentMessage = yield* messagesDb.insertMessageForInbox({
        message: req.payload.message,
        inboxId: receiverInbox.id,
        senderPublicKey,
        type: 'CANCEL_REQUEST_MESSAGING',
      })

      yield* reportMessageSent(1, commonMetricAttributes)
      yield* reportRequestCanceled(1, commonMetricAttributes)

      return {
        ...messageRecordToServerMessage({
          messageRecord: sentMessage,
          senderPublicKey: security.publicKey,
        }),
        notificationHandled: false,
      } satisfies CancelApprovalResponse
    }).pipe(
      withInboxActionRedisLock(
        Effect.gen(function* () {
          const security = yield* CurrentSecurity
          return security.publicKey
        }),
        req.payload.publicKey
      ),
      withDbTransaction,
      makeEndpointEffect
    )
)

export const cancelRequestV2 = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'cancelRequestApprovalV2',
  (req) =>
    Effect.gen(function* () {
      const commonMetricAttributes = commonMetricAttributesFromHeaders(
        req.headers
      )
      yield* validateChallengeInBody(req.payload)

      const {receiverInbox} = yield* findAndEnsureReceiverAndSenderInbox({
        receiver: req.payload.receiverPublicKey,
        sender: req.payload.publicKey,
      })

      const senderPublicKey = yield* encryptPublicKey(req.payload.publicKey)

      const messagesDb = yield* MessagesDbService
      const sentMessage = yield* messagesDb.insertMessageForInbox({
        message: req.payload.message,
        inboxId: receiverInbox.id,
        senderPublicKey,
        type: 'CANCEL_REQUEST_MESSAGING',
      })

      yield* reportMessageSent(1, commonMetricAttributes)
      yield* reportRequestCanceled(1, commonMetricAttributes)

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

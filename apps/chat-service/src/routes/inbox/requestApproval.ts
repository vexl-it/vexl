import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {type RequestApprovalResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
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

export const requestApproval = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'requestApproval',
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

      const encryptedSenderKey = yield* encryptPublicKey(security.publicKey)
      const messagesDb = yield* MessagesDbService
      const insertedMessage = yield* messagesDb.insertMessageForInbox({
        inboxId: receiverInbox.id,
        message: req.payload.message,
        senderPublicKey: encryptedSenderKey,
        type: 'REQUEST_MESSAGING',
      })

      yield* reportMessageSent(1, commonMetricAttributes)
      yield* reportRequestSent(1, commonMetricAttributes)

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

export const requestApprovalV2 = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'requestApprovalV2',
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

      const encryptedSenderKey = yield* encryptPublicKey(req.payload.publicKey)
      const messagesDb = yield* MessagesDbService
      const insertedMessage = yield* messagesDb.insertMessageForInbox({
        inboxId: receiverInbox.id,
        message: req.payload.message,
        senderPublicKey: encryptedSenderKey,
        type: 'REQUEST_MESSAGING',
      })

      yield* reportMessageSent(1, commonMetricAttributes)
      yield* reportRequestSent(1, commonMetricAttributes)

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

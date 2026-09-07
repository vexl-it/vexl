import {type CancelApprovalResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
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

export const leaveChat = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'leaveChat',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody({
        signedChallenge: req.payload.signedChallenge,
        publicKey: req.payload.senderPublicKey,
        publicKeyV2: Option.none(),
      })

      const {receiverInbox} = yield* findAndEnsureReceiverAndSenderInbox({
        sender: req.payload.senderPublicKey,
        receiver: req.payload.receiverPublicKey,
      })

      const senderKeyEncrypted = yield* encryptPublicKey(
        req.payload.senderPublicKey
      )
      const messagesDb = yield* MessagesDbService
      const sentMessage = yield* messagesDb.insertMessageForInbox({
        message: req.payload.message,
        inboxId: receiverInbox.id,
        senderPublicKey: senderKeyEncrypted,
        type: 'DELETE_CHAT',
      })
      const commonMetricAttributes = commonMetricAttributesFromHeaders(
        req.headers
      )
      yield* reportMessageSent(1, commonMetricAttributes)
      yield* reportChatClosed(1, commonMetricAttributes)

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

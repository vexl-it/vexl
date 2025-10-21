import {HttpApiBuilder} from '@effect/platform/index'
import {type CancelApprovalResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportChatClosed, reportMessageSent} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {ensureSenderInReceiverWhitelist} from '../../utils/isSenderInReceiverWhitelist'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

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
        })
      )

      const {receiverInbox, senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          sender: req.payload.senderPublicKey,
          receiver: req.payload.receiverPublicKey,
        })
      )

      yield* _(
        ensureSenderInReceiverWhitelist({
          sender: req.payload.senderPublicKey,
          receiver: receiverInbox.id,
        })
      )

      const whitelistDb = yield* _(WhitelistDbService)

      // Remove both whitelist records
      yield* _(
        whitelistDb.deleteWhitelistRecordBySenderAndReceiver({
          sender: senderInbox.publicKey,
          receiver: receiverInbox.id,
        })
      )
      yield* _(
        whitelistDb.deleteWhitelistRecordBySenderAndReceiver({
          sender: receiverInbox.publicKey,
          receiver: senderInbox.id,
        })
      )

      // send message about leaving
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
      yield* _(reportMessageSent(1))
      yield* _(reportChatClosed(1))

      return {
        id: Number(sentMessage.id),
        message: sentMessage.message,
        senderPublicKey: req.payload.senderPublicKey,
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

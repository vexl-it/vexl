import {
  LeaveChatErrors,
  type CancelApprovalResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {LeaveChatEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportChatClosed, reportMessageSent} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {ensureSenderInReceiverWhitelist} from '../../utils/isSenderInReceiverWhitelist'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const leaveChat = Handler.make(LeaveChatEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(
        validateChallengeInBody({
          signedChallenge: req.body.signedChallenge,
          publicKey: req.body.senderPublicKey,
        })
      )

      const {receiverInbox, senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          sender: req.body.senderPublicKey,
          receiver: req.body.receiverPublicKey,
        })
      )

      yield* _(
        ensureSenderInReceiverWhitelist({
          sender: req.body.senderPublicKey,
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
        encryptPublicKey(req.body.senderPublicKey)
      )
      const messagesDb = yield* _(MessagesDbService)
      const sentMessage = yield* _(
        messagesDb.insertMessageForInbox({
          message: req.body.message,
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
        senderPublicKey: req.body.senderPublicKey,
        notificationHandled: false,
      } satisfies CancelApprovalResponse
    }).pipe(
      withInboxActionRedisLock(
        req.body.senderPublicKey,
        req.body.receiverPublicKey
      ),
      withDbTransaction
    ),
    LeaveChatErrors
  )
)

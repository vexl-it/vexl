import {
  CancelRequestApprovalErrors,
  RequestNotPendingError,
  type CancelApprovalResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {CancelRequestApprovalEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportMessageSent, reportRequestCanceled} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const cancelRequest = Handler.make(
  CancelRequestApprovalEndpoint,
  (req, sec) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {receiverInbox, senderInbox} = yield* _(
          findAndEnsureReceiverAndSenderInbox({
            receiver: req.body.publicKey,
            sender: sec['public-key'],
          })
        )

        const whitelistDb = yield* _(WhitelistDbService)

        const whitelistRecord = yield* _(
          whitelistDb.findWhitelistRecordBySenderAndReceiver({
            receiver: receiverInbox.id,
            sender: senderInbox.publicKey,
          }),
          Effect.flatten,
          Effect.catchTag(
            'NoSuchElementException',
            () => new RequestNotPendingError()
          )
        )

        if (whitelistRecord.state !== 'WAITING') {
          return yield* _(Effect.fail(new RequestNotPendingError()))
        }

        yield* _(
          whitelistDb.updateWhitelistRecordState({
            id: whitelistRecord.id,
            state: 'CANCELED',
          })
        )

        const senderPublicKey = yield* _(encryptPublicKey(sec['public-key']))

        const messagesDb = yield* _(MessagesDbService)
        const sentMessage = yield* _(
          messagesDb.insertMessageForInbox({
            message: req.body.message,
            inboxId: receiverInbox.id,
            senderPublicKey,
            type: 'CANCEL_REQUEST_MESSAGING',
          })
        )

        yield* _(reportMessageSent(1))
        yield* _(reportRequestCanceled(1))

        return {
          id: Number(sentMessage.id),
          message: sentMessage.message,
          senderPublicKey: sec['public-key'],
          notificationHandled: false,
        } satisfies CancelApprovalResponse
      }).pipe(
        withInboxActionRedisLock(sec['public-key'], req.body.publicKey),
        withDbTransaction
      ),
      CancelRequestApprovalErrors
    )
)

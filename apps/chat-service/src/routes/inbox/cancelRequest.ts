import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {
  RequestNotPendingError,
  type CancelApprovalResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportMessageSent, reportRequestCanceled} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const cancelRequest = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'cancelRequestApproval',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)

      const {receiverInbox, senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.payload.publicKey,
          sender: security['public-key'],
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

      const senderPublicKey = yield* _(encryptPublicKey(security['public-key']))

      const messagesDb = yield* _(MessagesDbService)
      const sentMessage = yield* _(
        messagesDb.insertMessageForInbox({
          message: req.payload.message,
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
        senderPublicKey: security['public-key'],
        notificationHandled: false,
      } satisfies CancelApprovalResponse
    }).pipe(
      withInboxActionRedisLock(
        Effect.gen(function* (_) {
          const security = yield* _(CurrentSecurity)
          return security['public-key']
        }),
        req.payload.publicKey
      ),
      withDbTransaction,
      makeEndpointEffect
    )
)

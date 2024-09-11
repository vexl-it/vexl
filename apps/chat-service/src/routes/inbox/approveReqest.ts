import {
  ApproveRequestErrors,
  type ApproveRequestResponse,
  RequestCancelledError,
  RequestNotFoundError,
  RequestNotPendingError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ApproveRequestEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {encryptPublicKey} from '../../db/domain'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const approveRequest = Handler.make(ApproveRequestEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      // from the point of view of the one that sent the request
      const {receiverInbox, senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.body.publicKey,
          sender: req.body.publicKeyToConfirm,
        })
      )

      const whitelistDb = yield* _(WhitelistDbService)
      const whitelistRecord = yield* _(
        whitelistDb.findWhitelistRecordBySenderAndReceiver({
          sender: senderInbox.publicKey,
          receiver: receiverInbox.id,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new RequestNotFoundError()
        ),
        Effect.filterOrFail(
          (v): v is {state: 'WAITING'} & typeof v => v.state === 'WAITING',
          (v) =>
            v.state === 'CANCELED'
              ? new RequestCancelledError()
              : new RequestNotPendingError()
        )
      )

      const messagesDb = yield* _(MessagesDbService)
      if (req.body.approve) {
        yield* _(
          whitelistDb.updateWhitelistRecordState({
            id: whitelistRecord.id,
            state: 'APROVED',
          })
        )
        // make sure to insert the other way around!
        yield* _(
          whitelistDb.insertWhitelistRecord({
            receiver: senderInbox.id,
            sender: receiverInbox.publicKey,
            state: 'APROVED',
          })
        )
      } else {
        // Not approved
        yield* _(
          whitelistDb.updateWhitelistRecordState({
            id: whitelistRecord.id,
            state: 'DISAPROVED',
          })
        )

        // make sure the other way around is deleted
        yield* _(
          whitelistDb.deleteWhitelistRecordBySenderAndReceiver({
            receiver: senderInbox.id,
            sender: receiverInbox.publicKey,
          })
        )
      }

      const encryptedSenderPublicKey = yield* _(
        encryptPublicKey(req.body.publicKey)
      )

      const sentMessage = yield* _(
        messagesDb.insertMessageForInbox({
          inboxId: senderInbox.id,
          senderPublicKey: encryptedSenderPublicKey,
          message: req.body.message,
          type: req.body.approve ? 'APPROVE_MESSAGING' : 'DISAPPROVE_MESSAGING',
        })
      )

      return {
        id: Number(sentMessage.id),
        message: req.body.message,
        notificationHandled: false,
        senderPublicKey: req.body.publicKey,
      } satisfies ApproveRequestResponse
    }).pipe(
      withInboxActionRedisLock(req.body.publicKey, req.body.publicKeyToConfirm),
      withDbTransaction
    ),
    ApproveRequestErrors
  )
)

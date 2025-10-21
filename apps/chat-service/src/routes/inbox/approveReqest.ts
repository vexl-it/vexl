import {HttpApiBuilder} from '@effect/platform/index'
import {
  RequestCancelledError,
  RequestNotFoundError,
  RequestNotPendingError,
  type ApproveRequestResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey} from '../../db/domain'
import {
  reportMessageSent,
  reportRequestApproved,
  reportRequestRejected,
} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const approveRequest = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'approveRequest',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      // from the point of view of the one that sent the request
      const {receiverInbox, senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.payload.publicKey,
          sender: req.payload.publicKeyToConfirm,
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
      if (req.payload.approve) {
        yield* _(
          whitelistDb.updateWhitelistRecordState({
            id: whitelistRecord.id,
            state: 'APPROVED',
          })
        )
        // make sure to insert the other way around!
        yield* _(
          whitelistDb.insertWhitelistRecord({
            receiver: senderInbox.id,
            sender: receiverInbox.publicKey,
            state: 'APPROVED',
          })
        )

        yield* _(reportRequestApproved(1))
      } else {
        // Not approved
        yield* _(
          whitelistDb.updateWhitelistRecordState({
            id: whitelistRecord.id,
            state: 'DISAPPROVED',
          })
        )

        // make sure the other way around is deleted
        yield* _(
          whitelistDb.deleteWhitelistRecordBySenderAndReceiver({
            receiver: senderInbox.id,
            sender: receiverInbox.publicKey,
          })
        )
        yield* _(reportRequestRejected(0))
      }

      const encryptedSenderPublicKey = yield* _(
        encryptPublicKey(req.payload.publicKey)
      )

      const sentMessage = yield* _(
        messagesDb.insertMessageForInbox({
          inboxId: senderInbox.id,
          senderPublicKey: encryptedSenderPublicKey,
          message: req.payload.message,
          type: req.payload.approve
            ? 'APPROVE_MESSAGING'
            : 'DISAPPROVE_MESSAGING',
        })
      )

      return {
        id: Number(sentMessage.id),
        message: req.payload.message,
        notificationHandled: false,
        senderPublicKey: req.payload.publicKey,
      } satisfies ApproveRequestResponse
    }).pipe(
      withInboxActionRedisLock(
        req.payload.publicKey,
        req.payload.publicKeyToConfirm
      ),
      withDbTransaction,
      Effect.zipLeft(reportMessageSent(1)),
      makeEndpointEffect
    )
)

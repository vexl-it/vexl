import {HttpApiBuilder} from '@effect/platform/index'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {
  RequestMessagingNotAllowedError,
  type RequestApprovalResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import dayjs from 'dayjs'
import {Effect, Option, type ConfigError} from 'effect'
import {requestTimeoutDaysConfig} from '../../configs'
import {type InboxRecord} from '../../db/InboxDbService/domain'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportMessageSent, reportRequestSent} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {
  withInboxActionFromSecurityRedisLock,
  withInboxActionRedisLock,
} from '../../utils/withInboxActionRedisLock'

const canSendRequest = ({
  receiverInbox,
  senderInbox,
}: {
  receiverInbox: InboxRecord
  senderInbox: InboxRecord
}): Effect.Effect<
  boolean,
  UnexpectedServerError | ConfigError.ConfigError,
  WhitelistDbService
> =>
  Effect.gen(function* (_) {
    const whitelistDb = yield* _(WhitelistDbService)
    const whitelistRecordOption = yield* _(
      whitelistDb.findWhitelistRecordBySenderAndReceiver({
        sender: senderInbox.publicKey,
        receiver: receiverInbox.id,
      })
    )

    if (Option.isNone(whitelistRecordOption)) {
      return true
    }

    const whitelistRecord = whitelistRecordOption.value

    if (
      whitelistRecord.state === 'CANCELED' ||
      whitelistRecord.state === 'WAITING' ||
      whitelistRecord.state === 'DISAPPROVED'
    ) {
      const requestTimeoutDays = yield* _(requestTimeoutDaysConfig)
      const canBeRequestedAgainFrom = dayjs(whitelistRecord.date).add(
        requestTimeoutDays,
        'days'
      )

      return dayjs().isAfter(canBeRequestedAgainFrom)
    }

    return false
  })

export const requestApproval = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'requestApproval',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)

      const {receiverInbox, senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.payload.publicKey,
          sender: security.publicKey,
        })
      )

      if (!(yield* _(canSendRequest({receiverInbox, senderInbox})))) {
        return yield* _(Effect.fail(new RequestMessagingNotAllowedError()))
      }

      const whitelistDb = yield* _(WhitelistDbService)
      // first delete the existing record if it exists
      yield* _(
        whitelistDb.deleteWhitelistRecordBySenderAndReceiver({
          receiver: receiverInbox.id,
          sender: senderInbox.publicKey,
        })
      )

      yield* _(
        whitelistDb.insertWhitelistRecord({
          sender: senderInbox.publicKey,
          receiver: receiverInbox.id,
          state: 'WAITING',
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

      yield* _(reportMessageSent(1))
      yield* _(reportRequestSent(1))

      return {
        id: Number(insertedMessage.id),
        message: insertedMessage.message,
        senderPublicKey: security.publicKey,
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
      yield* _(validateChallengeInBody(req.payload))

      const {receiverInbox, senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.payload.receiverPublicKey,
          sender: req.payload.publicKey,
        })
      )

      if (!(yield* _(canSendRequest({receiverInbox, senderInbox})))) {
        return yield* _(Effect.fail(new RequestMessagingNotAllowedError()))
      }

      const whitelistDb = yield* _(WhitelistDbService)
      yield* _(
        whitelistDb.deleteWhitelistRecordBySenderAndReceiver({
          receiver: receiverInbox.id,
          sender: senderInbox.publicKey,
        })
      )

      yield* _(
        whitelistDb.insertWhitelistRecord({
          sender: senderInbox.publicKey,
          receiver: receiverInbox.id,
          state: 'WAITING',
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

      yield* _(reportMessageSent(1))
      yield* _(reportRequestSent(1))

      return {
        id: Number(insertedMessage.id),
        message: insertedMessage.message,
        senderPublicKey: req.payload.publicKey,
        notificationHandled: false,
      } satisfies RequestApprovalResponse
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

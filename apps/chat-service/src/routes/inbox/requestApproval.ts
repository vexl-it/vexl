import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  RequestApprovalErrors,
  type RequestApprovalResponse,
  RequestMessagingNotAllowedError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {RequestApprovalEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import dayjs from 'dayjs'
import {type ConfigError, Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {requestTimeoutDaysConfig} from '../../configs'
import {type InboxRecord} from '../../db/InboxDbService/domain'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {encryptPublicKey} from '../../db/domain'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

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
      whitelistRecord.state === 'DISAPROVED'
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

export const requestApproval = Handler.make(
  RequestApprovalEndpoint,
  (req, sec) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {receiverInbox, senderInbox} = yield* _(
          findAndEnsureReceiverAndSenderInbox({
            receiver: req.body.publicKey,
            sender: sec['public-key'],
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

        const encryptedSenderKey = yield* _(encryptPublicKey(sec['public-key']))
        const messagesDb = yield* _(MessagesDbService)
        const insertedMessage = yield* _(
          messagesDb.insertMessageForInbox({
            inboxId: receiverInbox.id,
            message: req.body.message,
            senderPublicKey: encryptedSenderKey,
            type: 'REQUEST_MESSAGING',
          })
        )

        return {
          id: Number(insertedMessage.id),
          message: insertedMessage.message,
          senderPublicKey: sec['public-key'],
          notificationHandled: false,
        } satisfies RequestApprovalResponse
      }).pipe(
        withInboxActionRedisLock(sec['public-key'], req.body.publicKey),
        withDbTransaction
      ),
      RequestApprovalErrors
    )
)

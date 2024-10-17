import {
  ReceiverOfferInboxDoesNotExistError,
  SenderUserInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  RequestApprovalEndpoint,
  RequestApprovalErrors,
} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ensureInboxExists} from '../../utils/ensureInboxExists'
import {ensureSenderInReceiverWhitelist} from '../../utils/isSenderInReceiverWhitelist'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const requestApproval = Handler.make(
  RequestApprovalEndpoint,
  (req, sec) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const senderInbox = yield* _(
          ensureInboxExists(sec['public-key']),
          Effect.catchTag(
            'InboxDoesNotExistError',
            () => new SenderUserInboxDoesNotExistError()
          )
        )
        const receiverInbox = yield* _(
          ensureInboxExists(req.body.publicKey),
          Effect.catchTag(
            'InboxDoesNotExistError',
            () => new ReceiverOfferInboxDoesNotExistError()
          )
        )

        yield* _(
          ensureSenderInReceiverWhitelist({
            sender: sec['public-key'],
            receiver: receiverInbox.id,
          }),
          Effect.
        )


      }).pipe(withInboxActionRedisLock(req.body.publicKey), withDbTransaction),
      RequestApprovalErrors
    )
)

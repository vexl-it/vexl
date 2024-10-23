import {type SendMessageResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  SendMessageEndpoint,
  SendMessageErrors,
} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey} from '../../db/domain'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {ensureSenderInReceiverWhitelist} from '../../utils/isSenderInReceiverWhitelist'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'

export const sendMessage = Handler.make(SendMessageEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const {receiverInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          sender: req.body.publicKey,
          receiver: req.body.receiverPublicKey,
        })
      )

      yield* _(
        ensureSenderInReceiverWhitelist({
          receiver: receiverInbox.id,
          sender: req.body.publicKey,
        })
      )

      const messagesDb = yield* _(MessagesDbService)
      const messageRecord = yield* _(
        messagesDb.insertMessageForInbox({
          message: req.body.message,
          senderPublicKey: yield* _(encryptPublicKey(req.body.publicKey)),
          inboxId: receiverInbox.id,
          type: req.body.messageType,
        })
      )

      return {
        id: Number(messageRecord.id),
        message: req.body.message,
        senderPublicKey: req.body.publicKey,
        notificationHandled: false,
      } satisfies SendMessageResponse
    }),
    SendMessageErrors
  ).pipe(withDbTransaction)
)

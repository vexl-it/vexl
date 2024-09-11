import {
  SendMessageErrors,
  type SendMessageResponse,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {SendMessageEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import {ForbiddenMessageTypeError} from '@vexl-next/rest-api/src/services/contact/contracts'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey} from '../../db/domain'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {forbiddenMessageTypes} from '../../utils/forbiddenMessageTypes'
import {ensureSenderInReceiverWhitelist} from '../../utils/isSenderInReceiverWhitelist'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const sendMessage = Handler.make(SendMessageEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(
        validateChallengeInBody({
          publicKey: req.body.senderPublicKey,
          signedChallenge: req.body.signedChallenge,
        })
      )

      if (forbiddenMessageTypes.includes(req.body.messageType)) {
        return yield* _(Effect.fail(new ForbiddenMessageTypeError()))
      }

      const {receiverInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          sender: req.body.senderPublicKey,
          receiver: req.body.receiverPublicKey,
        })
      )

      yield* _(
        ensureSenderInReceiverWhitelist({
          receiver: receiverInbox.id,
          sender: req.body.senderPublicKey,
        })
      )

      const messagesDb = yield* _(MessagesDbService)
      const messageRecord = yield* _(
        messagesDb.insertMessageForInbox({
          message: req.body.message,
          senderPublicKey: yield* _(encryptPublicKey(req.body.senderPublicKey)),
          inboxId: receiverInbox.id,
          type: req.body.messageType,
        })
      )

      return {
        id: Number(messageRecord.id),
        message: req.body.message,
        senderPublicKey: req.body.senderPublicKey,
        notificationHandled: false,
      } satisfies SendMessageResponse
    }),
    SendMessageErrors
  ).pipe(
    withInboxActionRedisLock(req.body.receiverPublicKey),
    withDbTransaction
  )
)

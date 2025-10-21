import {HttpApiBuilder} from '@effect/platform/index'
import {type SendMessageResponse} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {ForbiddenMessageTypeError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {MessagesDbService} from '../../db/MessagesDbService'
import {encryptPublicKey} from '../../db/domain'
import {reportMessageSent} from '../../metrics'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {forbiddenMessageTypes} from '../../utils/forbiddenMessageTypes'
import {ensureSenderInReceiverWhitelist} from '../../utils/isSenderInReceiverWhitelist'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const sendMessage = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Messages',
  'sendMessage',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(
        validateChallengeInBody({
          publicKey: req.payload.senderPublicKey,
          signedChallenge: req.payload.signedChallenge,
        })
      )

      if (forbiddenMessageTypes.includes(req.payload.messageType)) {
        return yield* _(Effect.fail(new ForbiddenMessageTypeError()))
      }

      const {receiverInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          sender: req.payload.senderPublicKey,
          receiver: req.payload.receiverPublicKey,
        })
      )

      yield* _(
        ensureSenderInReceiverWhitelist({
          receiver: receiverInbox.id,
          sender: req.payload.senderPublicKey,
        })
      )

      const messagesDb = yield* _(MessagesDbService)
      const messageRecord = yield* _(
        messagesDb.insertMessageForInbox({
          message: req.payload.message,
          senderPublicKey: yield* _(
            encryptPublicKey(req.payload.senderPublicKey)
          ),
          inboxId: receiverInbox.id,
          type: req.payload.messageType,
        })
      )

      return {
        id: Number(messageRecord.id),
        message: req.payload.message,
        senderPublicKey: req.payload.senderPublicKey,
        notificationHandled: false,
      } satisfies SendMessageResponse
    }).pipe(
      withInboxActionRedisLock(req.payload.receiverPublicKey),
      withDbTransaction,
      Effect.zipLeft(reportMessageSent(1)),
      makeEndpointEffect
    )
)

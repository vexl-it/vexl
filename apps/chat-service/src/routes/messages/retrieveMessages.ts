import {RetrieveMessagesErrors} from '@vexl-next/rest-api/src/services/chat/contracts'
import {RetrieveMessagesEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option, pipe} from 'effect'
import {Handler} from 'effect-http'
import {decryptPublicKey} from '../../db/domain'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {ensureInboxExists} from '../../utils/ensureInboxExists'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'

export const retrieveMessages = Handler.make(RetrieveMessagesEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const inbox = yield* _(ensureInboxExists(req.body.publicKey))
      const inboxDb = yield* _(InboxDbService)
      yield* _(
        inboxDb.updateInboxMetadata({
          clientVersion: req.headers.clientVersionOrNone,
          platform: req.headers.clientPlatformOrNone,
          id: inbox.id,
        })
      )

      const messagesDb = yield* _(MessagesDbService)
      const messages = yield* _(messagesDb.findMessagesByInboxId(inbox.id))

      const messagesToReturn = yield* _(
        pipe(
          messages,
          Array.map((oneMessage) =>
            decryptPublicKey(oneMessage.senderPublicKey).pipe(
              Effect.map((senderPublicKey) =>
                Option.some({
                  id: oneMessage.id,
                  message: oneMessage.message,
                  senderPublicKey,
                })
              ),
              // if one message fails, make sure to return the rest to not make the inbox unusable
              Effect.catchAll(() =>
                Effect.zipRight(
                  Effect.logError(
                    'Failed to decrypt message sender public key'
                  ),
                  Effect.succeed(Option.none())
                )
              )
            )
          ),
          Effect.all,
          Effect.map((array) => Array.filterMap(array, (v) => v))
        )
      )

      yield* _(
        messagesToReturn,
        Array.map((message) =>
          messagesDb.updateMessageAsPulledByMessageRecord(message.id)
        ),
        (effects) => Effect.all(effects, {batching: true})
      )

      return {
        messages: Array.map(messagesToReturn, (one) => ({
          ...one,
          id: Number(one.id),
        })),
      }
    }),
    RetrieveMessagesErrors
  ).pipe(withDbTransaction)
)

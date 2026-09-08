import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Filter, Option, pipe} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {decryptPublicKey} from '../../db/domain'
import {ensureInboxExists} from '../../utils/ensureInboxExists'
import {messageRecordToServerMessage} from './messageRecordToServerMessage'

export const retrieveMessages = makeHttpApiHandler(
  ChatApiSpecification,
  'Messages',
  'retrieveMessages',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const inbox = yield* ensureInboxExists(req.payload.publicKey)
      const inboxDb = yield* InboxDbService
      yield* inboxDb.updateInboxMetadata({
        clientVersion: req.headers.clientVersionOrNone,
        platform: req.headers.clientPlatformOrNone,
        id: inbox.id,
      })

      const messagesDb = yield* MessagesDbService
      const messages = yield* messagesDb.findMessagesByInboxId(inbox.id)

      const messagesToReturn = yield* pipe(
        messages,
        Array.map((oneMessage) =>
          decryptPublicKey(oneMessage.senderPublicKey).pipe(
            Effect.map((senderPublicKey) =>
              Option.some({
                messageRecord: oneMessage,
                serverMessage: messageRecordToServerMessage({
                  messageRecord: oneMessage,
                  senderPublicKey,
                }),
              })
            ),
            // if one message fails, make sure to return the rest to not make the inbox unusable
            Effect.catch((e) =>
              Effect.andThen(
                Effect.logWarning(
                  'Failed to decrypt message sender public key',
                  e,
                  {messageId: oneMessage.id}
                ),
                Effect.succeed(Option.none())
              )
            )
          )
        ),
        Effect.all,
        Effect.map((array) =>
          Array.filterMap(
            array,
            Filter.fromPredicateOption((v) => v)
          )
        )
      )

      yield* pipe(
        messagesToReturn,
        Array.map((message) =>
          messagesDb.updateMessageAsPulledByMessageRecord(
            message.messageRecord.id
          )
        ),
        (effects) => Effect.all(effects, {})
      )

      return {
        messages: Array.map(
          messagesToReturn,
          (oneMessage) => oneMessage.serverMessage
        ),
      }
    }).pipe(withDbTransaction, makeEndpointEffect)
)

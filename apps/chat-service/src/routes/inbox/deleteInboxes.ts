import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option, pipe} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {hashPublicKey} from '../../db/domain'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const deleteInboxes = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'deleteInboxes',
  (req) =>
    Effect.all(
      Array.map(req.payload.dataForRemoval, (inboxToDelete) =>
        Effect.gen(function* () {
          yield* validateChallengeInBody({
            ...inboxToDelete,
            publicKeyV2: Option.none(),
          })
          const hashedPublicKey = yield* hashPublicKey(inboxToDelete.publicKey)

          const inboxService = yield* InboxDbService
          const inbox = yield* pipe(
            inboxService.findInboxByPublicKey(hashedPublicKey),
            Effect.flatMap(Effect.fromOption),
            Effect.catchTag(
              'NoSuchElementError',
              () => new InboxDoesNotExistError()
            )
          )

          const messagesDb = yield* MessagesDbService
          yield* messagesDb.deleteAllMessagesByInboxId(inbox.id)

          yield* inboxService.deleteInboxByPublicKey(hashedPublicKey)
        }).pipe(
          withInboxActionRedisLock(inboxToDelete.publicKey),
          Effect.flatMap(() => Effect.succeed({}))
        )
      )
    ).pipe(withDbTransaction, makeEndpointEffect)
)

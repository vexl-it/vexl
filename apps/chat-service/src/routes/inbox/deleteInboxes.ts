import {
  DeleteInboxErrors,
  DeleteInboxesEndpoint,
} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect} from 'effect'
import {Handler} from 'effect-http'
import {hashPublicKey} from '../../db/domain'
import {InboxDbService} from '../../db/InboxDbService'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const deleteInboxes = Handler.make(DeleteInboxesEndpoint, (req) =>
  makeEndpointEffect(
    Effect.all(
      Array.map(req.body.dataForRemoval, (inboxToDelete) =>
        Effect.gen(function* (_) {
          yield* _(validateChallengeInBody(inboxToDelete))
          const hashedPublicKey = yield* _(
            hashPublicKey(inboxToDelete.publicKey)
          )

          const inboxService = yield* _(InboxDbService)
          // TODO delete all messages - can be done in non blocking fashion
          yield* _(inboxService.deleteInboxByPublicKey(hashedPublicKey))
        }).pipe(
          withInboxActionRedisLock(inboxToDelete.publicKey),
          Effect.flatMap(() => Effect.succeed({}))
        )
      )
    ),
    DeleteInboxErrors
  ).pipe(withDbTransaction)
)

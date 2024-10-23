import {
  DeleteInboxEndpoint,
  DeleteInboxErrors,
} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {hashPublicKey} from '../../db/domain'
import {InboxDbService} from '../../db/InboxDbService'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const deleteInbox = Handler.make(DeleteInboxEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))
      const hashedPublicKey = yield* _(hashPublicKey(req.body.publicKey))

      const inboxService = yield* _(InboxDbService)
      // TODO delete all messages - can be done in non blocking fashion
      yield* _(inboxService.deleteInboxByPublicKey(hashedPublicKey))
    }).pipe(withInboxActionRedisLock(req.body.publicKey), withDbTransaction),
    DeleteInboxErrors
  )
)

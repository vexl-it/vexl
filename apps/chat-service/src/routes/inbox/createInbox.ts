import {InvalidChallengeError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {CreateInboxEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {InboxDbService} from '../../db/InboxDbService'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const createInbox = Handler.make(CreateInboxEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const inboxService = yield* _(InboxDbService)
      yield* _(
        inboxService.insertInbox({
          publicKey: req.body.publicKey,
        })
      )
    }).pipe(withInboxActionRedisLock(req.body.publicKey), withDbTransaction),
    InvalidChallengeError
  )
)

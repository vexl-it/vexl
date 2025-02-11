import {CreateInboxEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {InvalidChallengeError} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {InboxDbService} from '../../db/InboxDbService'
import {hashPublicKey} from '../../db/domain'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const createInbox = Handler.make(CreateInboxEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const inboxService = yield* _(InboxDbService)
      const hashedPublicKey = yield* _(hashPublicKey(req.body.publicKey))

      const existingInbox = yield* _(
        inboxService.findInboxByPublicKey(hashedPublicKey)
      )
      if (Option.isSome(existingInbox)) {
        yield* _(
          inboxService.updateInboxMetadata({
            id: existingInbox.value.id,
            clientVersion: req.headers.clientVersionOrNone,
            platform: req.headers.clientPlatformOrNone,
          })
        )
        return null
      }

      yield* _(
        inboxService.insertInbox({
          publicKey: hashedPublicKey,
          clientVersion: req.headers.clientVersionOrNone,
          platform: req.headers.clientPlatformOrNone,
        })
      )

      return null
    }).pipe(withInboxActionRedisLock(req.body.publicKey), withDbTransaction),
    InvalidChallengeError
  )
)

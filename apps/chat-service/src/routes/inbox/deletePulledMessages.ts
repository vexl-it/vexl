import {DeletePulledMessagesErrors} from '@vexl-next/rest-api/src/services/chat/contracts'
import {DeletePulledMessagesEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {hashPublicKey} from '../../db/domain'
import {reportMessageFetchedAndRemoved} from '../../metrics'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const deletePulledMessages = Handler.make(
  DeletePulledMessagesEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.body))

        const hashedPublicKey = yield* _(hashPublicKey(req.body.publicKey))
        const inboxDb = yield* _(InboxDbService)

        const inboxRecord = yield* _(
          inboxDb.findInboxByPublicKey(hashedPublicKey),
          Effect.flatten,
          Effect.catchTag(
            'NoSuchElementException',
            () => new InboxDoesNotExistError()
          )
        )

        const messagesService = yield* _(MessagesDbService)
        yield* _(
          messagesService.deletePulledMessagesByInboxId(inboxRecord.id),
          Effect.tap(reportMessageFetchedAndRemoved)
        )

        return null
      }).pipe(withInboxActionRedisLock(req.body.publicKey), withDbTransaction),
      DeletePulledMessagesErrors
    )
)

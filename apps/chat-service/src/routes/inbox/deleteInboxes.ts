import {DeleteInboxErrors} from '@vexl-next/rest-api/src/services/chat/contracts'
import {DeleteInboxesEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect} from 'effect'
import {Handler} from 'effect-http'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {hashPublicKey} from '../../db/domain'
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
          const inbox = yield* _(
            inboxService.findInboxByPublicKey(hashedPublicKey),
            Effect.flatten,
            Effect.catchTag(
              'NoSuchElementException',
              () => new InboxDoesNotExistError()
            )
          )

          const whitelistDb = yield* _(WhitelistDbService)
          yield* _(
            whitelistDb.deleteWhitelistRecordsWhereInboxIsReceiverOrSender({
              inboxId: inbox.id,
              publicKey: hashedPublicKey,
            })
          )

          const messagesDb = yield* _(MessagesDbService)
          yield* _(messagesDb.deleteAllMessagesByInboxId(inbox.id))

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

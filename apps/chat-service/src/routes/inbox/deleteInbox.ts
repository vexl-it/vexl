import {HttpApiBuilder} from '@effect/platform/index'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {hashPublicKey} from '../../db/domain'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const deleteInbox = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'deleteInbox',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const hashedPublicKey = yield* _(hashPublicKey(req.payload.publicKey))

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

      return {}
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

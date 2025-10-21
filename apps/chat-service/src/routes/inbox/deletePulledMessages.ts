import {HttpApiBuilder} from '@effect/platform/index'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {hashPublicKey} from '../../db/domain'
import {reportMessageFetchedAndRemoved} from '../../metrics'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const deletePulledMessages = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'deletePulledMessages',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const hashedPublicKey = yield* _(hashPublicKey(req.payload.publicKey))
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

      return {}
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

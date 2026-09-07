import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, pipe} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {hashPublicKey} from '../../db/domain'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const deleteInbox = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'deleteInbox',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const hashedPublicKey = yield* hashPublicKey(req.payload.publicKey)

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

      return {}
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

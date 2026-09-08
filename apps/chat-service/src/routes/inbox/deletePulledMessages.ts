import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option, pipe} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {MessagesDbService} from '../../db/MessagesDbService'
import {hashPublicKey} from '../../db/domain'
import {reportMessageFetchedAndRemoved} from '../../metrics'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const deletePulledMessages = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'deletePulledMessages',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const hashedPublicKey = yield* hashPublicKey(req.payload.publicKey)
      const inboxDb = yield* InboxDbService

      const inboxRecord = yield* pipe(
        inboxDb.findInboxByPublicKey(hashedPublicKey),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
          () => new InboxDoesNotExistError()
        )
      )

      const messagesService = yield* MessagesDbService
      yield* pipe(
        messagesService.deletePulledMessagesByInboxId(inboxRecord.id),
        Effect.tap(({count, avgMessageAgeSeconds}) =>
          reportMessageFetchedAndRemoved(
            count,
            Option.getOrElse(
              avgMessageAgeSeconds,
              (): number | 'unknown' => 'unknown'
            ),
            commonMetricAttributesFromHeaders(req.headers)
          )
        )
      )

      return {}
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

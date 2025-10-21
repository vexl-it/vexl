import {HttpApiBuilder} from '@effect/platform/index'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {hashPublicKey} from '../../db/domain'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const createInbox = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'createInbox',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const inboxService = yield* _(InboxDbService)
      const hashedPublicKey = yield* _(hashPublicKey(req.payload.publicKey))

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
        return {}
      }

      yield* _(
        inboxService.insertInbox({
          publicKey: hashedPublicKey,
          clientVersion: req.headers.clientVersionOrNone,
          platform: req.headers.clientPlatformOrNone,
        })
      )

      return {}
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

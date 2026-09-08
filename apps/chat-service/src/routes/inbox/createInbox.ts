import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {hashPublicKey} from '../../db/domain'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const createInbox = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'createInbox',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const inboxService = yield* InboxDbService
      const hashedPublicKey = yield* hashPublicKey(req.payload.publicKey)

      const existingInbox =
        yield* inboxService.findInboxByPublicKey(hashedPublicKey)
      if (Option.isSome(existingInbox)) {
        yield* inboxService.updateInboxMetadata({
          id: existingInbox.value.id,
          clientVersion: req.headers.clientVersionOrNone,
          platform: req.headers.clientPlatformOrNone,
        })
        return {}
      }

      yield* inboxService.insertInbox({
        publicKey: hashedPublicKey,
        clientVersion: req.headers.clientVersionOrNone,
        platform: req.headers.clientPlatformOrNone,
      })

      return {}
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

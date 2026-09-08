import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const blockInbox = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'blockInbox',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      yield* findAndEnsureReceiverAndSenderInbox({
        receiver: req.payload.publicKey,
        sender: req.payload.publicKeyToBlock,
      })

      return {}
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

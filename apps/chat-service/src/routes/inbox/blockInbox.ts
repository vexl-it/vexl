import {HttpApiBuilder} from '@effect/platform/index'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const blockInbox = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'blockInbox',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const {receiverInbox: blockerInbox, senderInbox: toBlockInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.payload.publicKey,
          sender: req.payload.publicKeyToBlock,
        })
      )

      const whitelistDb = yield* _(WhitelistDbService)
      // we want to block so toBlockInbox can't send messages to blockerInbox
      yield* _(
        whitelistDb.deleteWhitelistRecordBySenderAndReceiver({
          sender: toBlockInbox.publicKey,
          receiver: blockerInbox.id,
        })
      )
      yield* _(
        whitelistDb.insertWhitelistRecord({
          sender: toBlockInbox.publicKey,
          receiver: blockerInbox.id,
          state: 'BLOCKED',
        })
      )

      return {}
    }).pipe(
      withInboxActionRedisLock(req.payload.publicKey),
      withDbTransaction,
      makeEndpointEffect
    )
)

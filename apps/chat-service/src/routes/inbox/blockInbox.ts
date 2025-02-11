import {BlockInboxErrors} from '@vexl-next/rest-api/src/services/chat/contracts'
import {BlockInboxEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const blockInbox = Handler.make(BlockInboxEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const {receiverInbox: blockerInbox, senderInbox: toBlockInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.body.publicKey,
          sender: req.body.publicKeyToBlock,
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

      return null
    }).pipe(withInboxActionRedisLock(req.body.publicKey), withDbTransaction),
    BlockInboxErrors
  )
)

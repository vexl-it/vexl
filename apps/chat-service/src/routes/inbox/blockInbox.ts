import {
  BlockInboxEndpoint,
  BlockInboxErrors,
} from '@vexl-next/rest-api/src/services/chat/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {WhitelistDbService} from '../../db/WhiteListDbService'
import {findAndEnsureReceiverAndSenderInbox} from '../../utils/findAndEnsureReceiverAndSenderInbox'
import {validateChallengeInBody} from '../../utils/validateChallengeInBody'
import {withInboxActionRedisLock} from '../../utils/withInboxActionRedisLock'

export const blockInbox = Handler.make(BlockInboxEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const {receiverInbox, senderInbox} = yield* _(
        findAndEnsureReceiverAndSenderInbox({
          receiver: req.body.publicKey,
          sender: req.body.publicKeyToBlock,
        })
      )

      const whitelistDb = yield* _(WhitelistDbService)
      yield* _(
        whitelistDb.deleteWhitelistRecordBySenderAndReceiver({
          sender: senderInbox.publicKey,
          receiver: receiverInbox.id,
        })
      )
      yield* _(
        whitelistDb.insertWhitelistRecord({
          receiver: receiverInbox.id,
          sender: senderInbox.publicKey,
          state: 'BLOCKED',
        })
      )
    }).pipe(withInboxActionRedisLock(req.body.publicKey), withDbTransaction),
    BlockInboxErrors
  )
)

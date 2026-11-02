import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ReceiverInboxDoesNotExistError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect} from 'effect'
import {InboxDbService} from '../db/InboxDbService'
import {type InboxRecord} from '../db/InboxDbService/domain'
import {hashPublicKey} from '../db/domain'

export const findAndEnsureReceiverInbox = (
  receiverPubKey: PublicKeyPemBase64
): Effect.Effect<
  InboxRecord,
  ReceiverInboxDoesNotExistError | UnexpectedServerError,
  InboxDbService
> =>
  Effect.gen(function* (_) {
    const receiverPubKeyHash = yield* _(hashPublicKey(receiverPubKey))

    const inboxService = yield* _(InboxDbService)
    return yield* _(
      inboxService.findInboxByPublicKey(receiverPubKeyHash),
      Effect.flatten,
      Effect.catchTag(
        'NoSuchElementException',
        () => new ReceiverInboxDoesNotExistError()
      )
    )
  })

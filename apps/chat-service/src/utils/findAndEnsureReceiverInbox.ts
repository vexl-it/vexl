import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ReceiverOfferInboxDoesNotExistError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect} from 'effect'
import {hashPublicKey} from '../db/domain'
import {InboxDbService} from '../db/InboxDbService'
import {type InboxRecord} from '../db/InboxDbService/domain'

export const findAndEnsureReceiverInbox = (
  receiverPubKey: PublicKeyPemBase64
): Effect.Effect<
  InboxRecord,
  ReceiverOfferInboxDoesNotExistError | UnexpectedServerError,
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
        () => new ReceiverOfferInboxDoesNotExistError()
      )
    )
  })

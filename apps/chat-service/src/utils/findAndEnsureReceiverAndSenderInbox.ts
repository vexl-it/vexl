import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect} from 'effect'
import {InboxDbService} from '../db/InboxDbService'
import {type InboxRecord} from '../db/InboxDbService/domain'
import {hashPublicKey} from '../db/domain'

export const findAndEnsureReceiverAndSenderInbox = ({
  receiver,
  sender,
}: {
  receiver: PublicKeyPemBase64
  sender: PublicKeyPemBase64
}): Effect.Effect<
  {senderInbox: InboxRecord; receiverInbox: InboxRecord},
  | SenderInboxDoesNotExistError
  | ReceiverInboxDoesNotExistError
  | UnexpectedServerError,
  InboxDbService
> =>
  Effect.gen(function* (_) {
    const receiverPubKeyHash = yield* _(hashPublicKey(receiver))
    const senderPubKeyHash = yield* _(hashPublicKey(sender))

    const inboxService = yield* _(InboxDbService)
    const senderInbox = yield* _(
      inboxService.findInboxByPublicKey(senderPubKeyHash),
      Effect.flatten,
      Effect.catchTag(
        'NoSuchElementException',
        () => new SenderInboxDoesNotExistError()
      )
    )
    const receiverInbox = yield* _(
      inboxService.findInboxByPublicKey(receiverPubKeyHash),
      Effect.flatten,
      Effect.catchTag(
        'NoSuchElementException',
        () => new ReceiverInboxDoesNotExistError()
      )
    )

    return {
      senderInbox,
      receiverInbox,
    }
  })

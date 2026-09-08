import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect, pipe} from 'effect'
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
  Effect.gen(function* () {
    const receiverPubKeyHash = yield* hashPublicKey(receiver)
    const senderPubKeyHash = yield* hashPublicKey(sender)

    const inboxService = yield* InboxDbService
    const senderInbox = yield* pipe(
      inboxService.findInboxByPublicKey(senderPubKeyHash),
      Effect.flatMap(Effect.fromOption),
      Effect.catchTag(
        'NoSuchElementError',
        () => new SenderInboxDoesNotExistError()
      )
    )
    const receiverInbox = yield* pipe(
      inboxService.findInboxByPublicKey(receiverPubKeyHash),
      Effect.flatMap(Effect.fromOption),
      Effect.catchTag(
        'NoSuchElementError',
        () => new ReceiverInboxDoesNotExistError()
      )
    )

    return {
      senderInbox,
      receiverInbox,
    }
  })

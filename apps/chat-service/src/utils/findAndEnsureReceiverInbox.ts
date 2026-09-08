import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ReceiverInboxDoesNotExistError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect, pipe} from 'effect'
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
  Effect.gen(function* () {
    const receiverPubKeyHash = yield* hashPublicKey(receiverPubKey)

    const inboxService = yield* InboxDbService
    return yield* pipe(
      inboxService.findInboxByPublicKey(receiverPubKeyHash),
      Effect.flatMap(Effect.fromOption),
      Effect.catchTag(
        'NoSuchElementError',
        () => new ReceiverInboxDoesNotExistError()
      )
    )
  })

import {Schema} from '@effect/schema'
import {
  type PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect} from 'effect'
import {InboxDbService} from '../db/InboxDbService'
import {type InboxRecord} from '../db/InboxDbService/domain'

export class InboxDoesNotExistError extends Schema.TaggedError<InboxDoesNotExistError>(
  'InboxDoesNotExistError'
)('InboxDoesNotExistError', {
  publicKey: PublicKeyPemBase64E,
}) {}

export const ensureInboxExists = (
  publicKey: PublicKeyPemBase64
): Effect.Effect<
  InboxRecord,
  InboxDoesNotExistError | UnexpectedServerError,
  InboxDbService
> =>
  InboxDbService.pipe(
    Effect.flatMap((inboxDb) => inboxDb.findInboxByPublicKey(publicKey)),
    Effect.flatten,
    Effect.catchTag(
      'NoSuchElementException',
      () => new InboxDoesNotExistError({publicKey})
    )
  )

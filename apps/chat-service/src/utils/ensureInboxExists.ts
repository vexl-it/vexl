import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect} from 'effect'
import {InboxDbService} from '../db/InboxDbService'
import {type InboxRecord} from '../db/InboxDbService/domain'
import {hashPublicKey} from '../db/domain'

export const ensureInboxExists = (
  publicKey: PublicKeyPemBase64
): Effect.Effect<
  InboxRecord,
  InboxDoesNotExistError | UnexpectedServerError,
  InboxDbService
> =>
  Effect.gen(function* (_) {
    const inboxDb = yield* _(InboxDbService)

    const publicKeyEncrypted = yield* _(hashPublicKey(publicKey))

    return yield* _(
      inboxDb.findInboxByPublicKey(publicKeyEncrypted),
      Effect.flatten,
      Effect.catchTag(
        'NoSuchElementException',
        () => new InboxDoesNotExistError()
      )
    )
  })

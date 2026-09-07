import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, pipe} from 'effect'
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
  Effect.gen(function* () {
    const inboxDb = yield* InboxDbService

    const publicKeyEncrypted = yield* hashPublicKey(publicKey)

    return yield* pipe(
      inboxDb.findInboxByPublicKey(publicKeyEncrypted),
      Effect.flatMap(Effect.fromOption),
      Effect.catchTag('NoSuchElementError', () => new InboxDoesNotExistError())
    )
  })

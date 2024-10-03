import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect} from 'effect'

export interface InboxDbOperations {
  deleteInboxByPublicKey: (
    args: PublicKeyPemBase64
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class InboxDbService extends Context.Tag('InboxDbService')<
  InboxDbService,
  InboxDbOperations
>() {}

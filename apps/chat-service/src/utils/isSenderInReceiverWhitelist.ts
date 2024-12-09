import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NotPermittedToSendMessageToTargetInboxError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect, Option} from 'effect'
import {hashPublicKey} from '../db/domain'
import {type InboxRecordId} from '../db/InboxDbService/domain'
import {WhitelistDbService} from '../db/WhiteListDbService'

export const isSenderInReceiverWhitelist = ({
  sender,
  receiver,
}: {
  sender: PublicKeyPemBase64
  receiver: InboxRecordId
}): Effect.Effect<boolean, UnexpectedServerError, WhitelistDbService> =>
  Effect.gen(function* (_) {
    const hashedSenderKey = yield* _(hashPublicKey(sender))

    const whitelistDb = yield* _(WhitelistDbService)
    const whitelistRecord = yield* _(
      whitelistDb.findWhitelistRecordBySenderAndReceiver({
        sender: hashedSenderKey,
        receiver,
      })
    )

    if (Option.isNone(whitelistRecord)) return false
    if (whitelistRecord.value.state === 'APPROVED') return true
    return false
  })

export const ensureSenderInReceiverWhitelist = ({
  receiver,
  sender,
}: {
  sender: PublicKeyPemBase64
  receiver: InboxRecordId
}): Effect.Effect<
  void,
  NotPermittedToSendMessageToTargetInboxError | UnexpectedServerError,
  WhitelistDbService
> =>
  isSenderInReceiverWhitelist({sender, receiver}).pipe(
    Effect.filterOrFail(
      (one) => one,
      () => new NotPermittedToSendMessageToTargetInboxError()
    )
  )

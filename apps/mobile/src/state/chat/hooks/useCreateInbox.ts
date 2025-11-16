import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {generateKeyPairE} from '@vexl-next/resources-utils/src/utils/crypto'
import {Array, Effect, Option} from 'effect/index'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {getNotificationTokenE} from '../../../utils/notifications'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {ApiErrorCreatingInbox, type InboxInState} from '../domain'

export const upsertInboxOnBeAndLocallyActionAtom = atom(
  null,
  (
    get,
    set,
    request:
      | {for: 'myOffer' | 'offerRequest'; offerId: OfferId}
      | {for: 'userSesssion'; key: PrivateKeyHolder}
  ) =>
    Effect.gen(function* (_) {
      const api = get(apiAtom)

      const messagingState = get(messagingStateAtom)
      const existingInbox = Array.findFirst(messagingState, (one) => {
        if (request.for === 'myOffer')
          return one.inbox.offerId === request.offerId
        if (request.for === 'offerRequest')
          return one.inbox.requestOfferId === request.offerId
        if (request.for === 'userSesssion')
          return (
            one.inbox.privateKey.publicKeyPemBase64 ===
            request.key.publicKeyPemBase64
          )
        return false
      })
      // inbox already exists
      if (Option.isSome(existingInbox)) {
        // Always hit create inbox. The backend wont fail if the inbox exists
        yield* _(
          api.chat.createInbox({
            token: (yield* _(getNotificationTokenE())) ?? undefined,
            keyPair: existingInbox.value.inbox.privateKey,
          })
        )
        return existingInbox.value
      }

      const inboxKeypair = yield* _(generateKeyPairE())
      const notificationToken = yield* _(getNotificationTokenE())
      yield* _(
        api.chat.createInbox({
          token: notificationToken ?? undefined,
          keyPair: inboxKeypair,
        }),
        Effect.mapError((e) => new ApiErrorCreatingInbox({cause: e}))
      )

      const newInboxInState: InboxInState = {
        inbox: {
          privateKey: inboxKeypair,
          offerId: request.for === 'myOffer' ? request.offerId : undefined,
          requestOfferId:
            request.for === 'offerRequest' ? request.offerId : undefined,
        },
        chats: [],
      }
      set(messagingStateAtom, (s) => [...s, newInboxInState])

      return newInboxInState
    })
)

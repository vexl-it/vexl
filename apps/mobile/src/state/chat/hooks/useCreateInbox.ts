import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type NoteId} from '@vexl-next/domain/src/general/notes'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {generateKeyPairE} from '@vexl-next/resources-utils/src/utils/crypto'
import {Array, Effect, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {ApiErrorCreatingInbox, type InboxInState} from '../domain'

export const upsertInboxOnBeAndLocallyActionAtom = atom(
  null,
  (
    get,
    set,
    request:
      | {for: 'myOffer' | 'offerRequest'; offerId: OfferId}
      | {for: 'myNote' | 'noteRequest'; noteId: NoteId}
      | {for: 'userSesssion'; key: PrivateKeyHolder}
  ) =>
    Effect.gen(function* () {
      const api = get(apiAtom)

      const messagingState = get(messagingStateAtom)
      const existingInbox = Array.findFirst(messagingState, (one) => {
        if (request.for === 'myOffer')
          return one.inbox.offerId === request.offerId
        if (request.for === 'offerRequest')
          return one.inbox.requestOfferId === request.offerId
        if (request.for === 'myNote') return one.inbox.noteId === request.noteId
        if (request.for === 'noteRequest')
          return one.inbox.requestNoteId === request.noteId
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
        yield* api.chat.createInbox({
          keyPair: existingInbox.value.inbox.privateKey,
        })
        return existingInbox.value
      }

      const inboxKeypair = yield* generateKeyPairE()
      yield* pipe(
        api.chat.createInbox({
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
          noteId: request.for === 'myNote' ? request.noteId : undefined,
          requestNoteId:
            request.for === 'noteRequest' ? request.noteId : undefined,
        },
        chats: [],
      }
      set(messagingStateAtom, (s) => [...s, newInboxInState])

      return newInboxInState
    })
)

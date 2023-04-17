import {type Inbox} from '@vexl-next/domain/dist/general/messaging'
import * as TE from 'fp-ts/TaskEither'
import {
  type ApiErrorCreatingInbox,
  type ChatState,
  type ErrorInboxAlreadyExists,
  type InboxInState,
} from '../domain'
import {usePrivateApiAssumeLoggedIn} from '../../../api'
import {useStore} from 'jotai'
import {useCallback} from 'react'
import * as O from 'optics-ts'
import {messagingStateAtom} from '../atom'
import {toBasicError} from '@vexl-next/domain/dist/utility/errors'
import {pipe} from 'fp-ts/function'
import {type PrivateKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

function getNotificationToken(): string | undefined {
  // TODO implement this
  return undefined
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function focusAddInbox(optic: O.OpticFor<ChatState>) {
  return optic.appendTo()
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function focusOneInbox(privateKey: PrivateKeyPemBase64) {
  return (optic: O.OpticFor<ChatState>) =>
    optic.find((one) => one.inbox.privateKey.privateKeyPemBase64 === privateKey)
}

export default function useCreateInbox(): (
  inbox: Inbox
) => TE.TaskEither<ApiErrorCreatingInbox | ErrorInboxAlreadyExists, ChatState> {
  const api = usePrivateApiAssumeLoggedIn()
  const store = useStore()

  return useCallback(
    (inbox) => {
      const token = getNotificationToken()

      const messagingStateOptic = O.optic<ChatState>()
      const oneInboxPrism = focusOneInbox(inbox.privateKey.privateKeyPemBase64)(
        messagingStateOptic
      )

      if (O.preview(oneInboxPrism)(store.get(messagingStateAtom)))
        return TE.left(
          toBasicError('ErrorInboxAlreadyExists')(
            new Error('Inbox already exists')
          )
        )

      return pipe(
        TE.Do,
        TE.chainW(() =>
          api.chat.createInbox({token, keyPair: inbox.privateKey})
        ),
        TE.mapLeft(toBasicError('ApiErrorCreatingInbox')),
        TE.map(() => {
          const newInbox: InboxInState = {inbox, chats: []}
          return store.set(
            messagingStateAtom,
            O.set(focusAddInbox(messagingStateOptic))(newInbox)
          )
        })
      )
    },
    [api, store]
  )
}

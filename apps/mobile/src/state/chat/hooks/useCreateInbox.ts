import {type Inbox} from '@vexl-next/domain/dist/general/messaging'
import * as TE from 'fp-ts/TaskEither'
import {
  type ApiErrorCreatingInbox,
  type MessagingState,
  type ErrorInboxAlreadyExists,
  type InboxInState,
} from '../domain'
import {privateApiAtom} from '../../../api'
import {atom, useSetAtom} from 'jotai'
import * as O from 'optics-ts'
import {toBasicError} from '@vexl-next/domain/dist/utility/errors'
import {pipe} from 'fp-ts/function'
import {type PrivateKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {getNotificationToken} from '../../../utils/notifications'
import messagingStateAtom from '../atoms/messagingStateAtom'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function focusAddInbox(optic: O.OpticFor<MessagingState>) {
  return optic.appendTo()
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function focusOneInbox(privateKey: PrivateKeyPemBase64) {
  return (optic: O.OpticFor<MessagingState>) =>
    optic.find((one) => one.inbox.privateKey.privateKeyPemBase64 === privateKey)
}

export const createInboxAtom = atom<
  null,
  [{inbox: Inbox}],
  TE.TaskEither<ApiErrorCreatingInbox | ErrorInboxAlreadyExists, InboxInState>
>(null, (get, set, params) => {
  const api = get(privateApiAtom)
  const {inbox} = params
  const messagingStateOptic = O.optic<MessagingState>()
  const oneInboxPrism = focusOneInbox(inbox.privateKey.privateKeyPemBase64)(
    messagingStateOptic
  )

  if (O.preview(oneInboxPrism)(get(messagingStateAtom)))
    return TE.left(
      toBasicError('ErrorInboxAlreadyExists')(new Error('Inbox already exists'))
    )

  return pipe(
    TE.Do,
    TE.chainTaskK(getNotificationToken),
    TE.chainW((token) =>
      pipe(
        api.chat.createInbox({
          token: token ?? undefined,
          keyPair: inbox.privateKey,
        }),
        TE.mapLeft(toBasicError('ApiErrorCreatingInbox'))
      )
    ),
    TE.map(() => {
      const newInbox: InboxInState = {inbox, chats: []}
      set(
        messagingStateAtom,
        O.set(focusAddInbox(messagingStateOptic))(newInbox)
      )
      return newInbox
    })
  )
})

export default function useCreateInbox(): (a: {
  inbox: Inbox
}) => TE.TaskEither<
  ApiErrorCreatingInbox | ErrorInboxAlreadyExists,
  InboxInState
> {
  return useSetAtom(createInboxAtom)
}

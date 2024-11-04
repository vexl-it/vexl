import {type PrivateKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type Inbox} from '@vexl-next/domain/src/general/messaging'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, useSetAtom} from 'jotai'
import * as O from 'optics-ts'
import {apiAtom} from '../../../api'
import {getNotificationToken} from '../../../utils/notifications'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {
  type ApiErrorCreatingInbox,
  type ErrorInboxAlreadyExists,
  type InboxInState,
  type MessagingState,
} from '../domain'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function focusAddInbox(optic: O.OpticFor<MessagingState>) {
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
  const api = get(apiAtom)
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
        effectToTaskEither(
          api.chat.createInbox({
            token: token ?? undefined,
            keyPair: inbox.privateKey,
          })
        ),
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

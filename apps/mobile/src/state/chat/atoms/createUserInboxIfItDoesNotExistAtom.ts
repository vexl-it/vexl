import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {focusAtom} from 'jotai-optics'
import messagingStateAtom from './messagingStateAtom'
import {type InboxInState, type MessagingState} from '../domain'
import {atom} from 'jotai'
import * as O from 'optics-ts'
import {focusAddInbox} from '../hooks/useCreateInbox'

export const createUserInboxIfItDoesNotExistAtom = atom(
  null,
  (get, set, privateKey: PrivateKeyHolder) => {
    const messagingStateOptic = O.optic<MessagingState>()
    const userInboxAtom = focusAtom(messagingStateAtom, (o) =>
      o
        .find(
          (one) =>
            one.inbox.privateKey.publicKeyPemBase64 ===
            privateKey.publicKeyPemBase64
        )
        .prop('inbox')
    )

    if (!get(userInboxAtom)) {
      const newInbox: InboxInState = {
        inbox: {privateKey},
        chats: [],
      }

      set(
        messagingStateAtom,
        O.set(focusAddInbox(messagingStateOptic))(newInbox)
      )
    }
  }
)

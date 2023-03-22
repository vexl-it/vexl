import {type Inbox, type Chat} from '@vexl-next/domain/dist/general/messaging'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ElemType} from 'optics-ts/utils'

export type Inboxes = Inbox[]
export type Chats = Chat[]

export const inboxesAtom = atom<Inboxes>([])
export const chatsAtom = atom<Inboxes>([])

export const inboxByPrivateKey = (
  privateKey: PrivateKeyHolder
): WritableAtom<
  ElemType<(Inbox[] & ((prev: Inbox[]) => Inbox[])) | Inbox[]> | undefined,
  [
    SetStateAction<ElemType<(Inbox[] & ((prev: Inbox[]) => Inbox[])) | Inbox[]>>
  ],
  void
> =>
  focusAtom(inboxesAtom, (optic) =>
    optic.find(
      (inbox) =>
        inbox.privateKey.privateKeyPemBase64 === privateKey.privateKeyPemBase64
    )
  )

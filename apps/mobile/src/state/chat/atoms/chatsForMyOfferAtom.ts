import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {type ChatWithMessages} from '../domain'

export function chatsForMyOfferAtom({
  offerPublicKey,
}: {
  offerPublicKey: PublicKeyPemBase64 | undefined
}): Atom<ChatWithMessages[] | undefined> {
  return selectAtom(
    messagingStateAtom,
    (messagingState) =>
      messagingState.find(
        (one) => one.inbox.privateKey.publicKeyPemBase64 === offerPublicKey
      )?.chats
  )
}

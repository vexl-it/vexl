import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import messagingStateAtom from '../atoms/messagingStateAtom'
import {type Chat} from '@vexl-next/domain/dist/general/messaging'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'

export function chatsForMyOfferAtom({
  offerPublicKey,
}: {
  offerPublicKey: PublicKeyPemBase64 | undefined
}): Atom<Chat[] | undefined> {
  return selectAtom(messagingStateAtom, (messagingState) =>
    messagingState
      .find((one) => one.inbox.privateKey.publicKeyPemBase64 === offerPublicKey)
      ?.chats.map((one) => one.chat)
  )
}

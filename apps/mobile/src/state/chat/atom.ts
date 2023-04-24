import {atomWithParsedMmkvStorage} from '../../utils/atomWithParsedMmkvStorage'
import {MessagingState, type ChatWithMessages} from './domain'
import {focusAtom} from 'jotai-optics'
import {atom} from 'jotai'
import * as O from 'optics-ts'
import {type ChatId} from '@vexl-next/domain/dist/general/messaging'
import {
  type PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'

export const messagingStateAtom = atomWithParsedMmkvStorage(
  'messagingState',
  [],
  MessagingState
)

export const chatsListAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.elems().prop('chats').elems()
)

export const inboxesAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.elems().prop('inbox')
)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function inboxAtom(publicKey: PublicKeyPemBase64) {
  return focusAtom(messagingStateAtom, (optic) =>
    optic.find((one) => one.inbox.privateKey.publicKeyPemBase64 === publicKey)
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function chatForPublicKeyAtom({
  inboxPrivateKey,
  otherSidePublicKey,
}: {
  inboxPrivateKey: PrivateKeyPemBase64
  otherSidePublicKey: PublicKeyPemBase64
}) {
  return focusAtom(messagingStateAtom, (optic) =>
    optic
      .find(
        (one) => one.inbox.privateKey.privateKeyPemBase64 === inboxPrivateKey
      )
      .prop('chats')
      .find((one) => one.otherSide.publicKey === otherSidePublicKey)
  )
}

export const chatsToDisplayAtom = atom((get) =>
  get(chatsListAtom).filter((oneChat) => {
    const lastMessage = oneChat.messages.at(-1)
    return (
      lastMessage &&
      lastMessage.message.messageType !== 'REQUEST_MESSAGING' &&
      (lastMessage.message.messageType !== 'BLOCK_CHAT' ||
        lastMessage.state === 'received')
    )
  })
)

export const blockedChatsAtom = atom((get) =>
  get(chatsListAtom).filter((oneChat) => {
    const lastMessage = oneChat.messages.at(-1)
    return (
      lastMessage &&
      lastMessage.message.messageType === 'BLOCK_CHAT' &&
      lastMessage.state === 'sent'
    )
  })
)

export const receivedChatRequests = atom((get) =>
  get(chatsListAtom).filter((oneChat) => {
    const lastMessage = oneChat.messages.at(-1)
    return (
      lastMessage &&
      lastMessage.message.messageType === 'REQUEST_MESSAGING' &&
      lastMessage.state === 'received'
    )
  })
)

export const sentChatRequests = atom((get) =>
  get(chatsListAtom).filter((oneChat) => {
    const lastMessage = oneChat.messages.at(-1)
    return (
      lastMessage &&
      lastMessage.message.messageType === 'REQUEST_MESSAGING' &&
      lastMessage.state === 'sent'
    )
  })
)

export const lastMessageTimeFocus = O.optic<ChatWithMessages>()
  .prop('messages')
  .at(0)
  .prop('message')
  .prop('time')

export const orderedChatsAtom = atom((get) =>
  get(chatsListAtom).sort(
    (i1, i2) =>
      (O.preview(lastMessageTimeFocus)(i1) ?? 0) -
      (O.preview(lastMessageTimeFocus)(i2) ?? 0)
  )
)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function chatAtom(chatId: ChatId) {
  return focusAtom(messagingStateAtom, (optic) =>
    optic
      .elems()
      .prop('chats')
      .find((i) => i.id === chatId)
  )
}

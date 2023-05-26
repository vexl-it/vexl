import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import messagingStateAtom from './messagingStateAtom'
import {type ChatWithMessages} from '../domain'

function selectChatByInboxKeyAndSenderKey({
  inboxKey,
  senderKey,
}: {
  inboxKey: PublicKeyPemBase64
  senderKey: PublicKeyPemBase64
}): Atom<ChatWithMessages | undefined> {
  return selectAtom(messagingStateAtom, (messagingState) =>
    messagingState
      .find((one) => one.inbox.privateKey.publicKeyPemBase64 === inboxKey)
      ?.chats.find((one) => one.chat.otherSide.publicKey === senderKey)
  )
}

export default selectChatByInboxKeyAndSenderKey

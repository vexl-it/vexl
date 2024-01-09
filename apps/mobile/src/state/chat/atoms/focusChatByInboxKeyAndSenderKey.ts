import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import messagingStateAtom from './messagingStateAtom'
import {type ChatWithMessages} from '../domain'
import {focusAtom} from 'jotai-optics'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'

function focusChatByInboxKeyAndSenderKey({
  inboxKey,
  senderKey,
}: {
  inboxKey: PublicKeyPemBase64
  senderKey: PublicKeyPemBase64
}): FocusAtomType<ChatWithMessages | undefined> {
  return focusAtom(messagingStateAtom, (p) =>
    p
      .find((one) => one.inbox.privateKey.publicKeyPemBase64 === inboxKey)
      .prop('chats')
      .find((one) => one.chat.otherSide.publicKey === senderKey)
  )
}

export default focusChatByInboxKeyAndSenderKey

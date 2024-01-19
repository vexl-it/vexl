import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {focusAtom} from 'jotai-optics'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatWithMessages} from '../domain'
import messagingStateAtom from './messagingStateAtom'

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

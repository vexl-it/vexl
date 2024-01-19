import {type Inbox} from '@vexl-next/domain/src/general/messaging'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {focusAtom} from 'jotai-optics'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatWithMessages} from '../domain'
import messagingStateAtom from './messagingStateAtom'

export default function focusChatForTheirOfferAtom({
  inbox,
  offerInfo,
}: {
  inbox: Inbox
  offerInfo: OfferInfo
}): FocusAtomType<ChatWithMessages | undefined> {
  return focusAtom(messagingStateAtom, (o) =>
    o
      .find(
        (one) =>
          one.inbox.privateKey.publicKeyPemBase64 ===
          inbox.privateKey.publicKeyPemBase64
      )
      .prop('chats')
      .find(
        (one) =>
          one.chat.otherSide.publicKey === offerInfo.publicPart.offerPublicKey
      )
  )
}

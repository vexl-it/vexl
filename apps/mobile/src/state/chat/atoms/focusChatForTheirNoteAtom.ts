import {type Inbox} from '@vexl-next/domain/src/general/messaging'
import {type NoteInfo} from '@vexl-next/domain/src/general/notes'
import {focusAtom} from 'jotai-optics'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {type ChatWithMessages} from '../domain'
import messagingStateAtom from './messagingStateAtom'

export default function focusChatForTheirNoteAtom({
  inbox,
  noteInfo,
}: {
  inbox: Inbox
  noteInfo: NoteInfo
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
          one.chat.otherSide.publicKey === noteInfo.publicPart.notePublicKey
      )
  )
}

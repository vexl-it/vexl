import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type Getter} from 'jotai'
import focusChatWithMessagesAtom from '../../state/chat/atoms/focusChatWithMessagesAtom'
import {getOtherSideData} from '../../state/chat/atoms/selectOtherSideDataAtom'
import {type ChatWithMessages} from '../../state/chat/domain'
import {offerForChatOriginAtom} from '../../state/marketplace/atoms/offersState'
import {noteForChatOriginAtom} from '../../state/notes/atoms/notesState'
import {getOtherSideRealNameOrFriendLevel} from '../chat/getOtherSideFriendLevel'
import {translationAtom} from '../localization/I18nProvider'

export function getChatNotificationName(
  get: Getter,
  chat: Chat | ChatWithMessages
): string {
  const chatInfo = 'chat' in chat ? chat.chat : chat
  const chatWithMessages =
    'messages' in chat
      ? chat
      : get(
          focusChatWithMessagesAtom({
            chatId: chatInfo.id,
            inboxKey: chatInfo.inbox.privateKey.publicKeyPemBase64,
          })
        )

  return (
    getOtherSideRealNameOrFriendLevel({
      chat: chatWithMessages ? {...chatWithMessages, chat: chatInfo} : chatInfo,
      offerInfo: get(offerForChatOriginAtom(chatInfo.origin))?.offerInfo,
      note: get(noteForChatOriginAtom(chatInfo.origin)),
      t: get(translationAtom).t,
    }) ?? getOtherSideData(chatInfo).userName
  )
}

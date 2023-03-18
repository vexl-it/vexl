import {z} from 'zod'
import {
  Chat,
  type ChatId,
  ChatMessage,
  Inbox,
} from '@vexl-next/domain/dist/general/Inbox.brand'
import {atomWithParsedMmkvStorage} from '../../utils/atomWithParsedMmkvStorage'
import {focusAtom} from 'jotai-optics'

export const MessagingState = z.object({
  inboxes: z.array(Inbox),
  chats: z.array(Chat),
})
export type MessagingState = z.TypeOf<typeof MessagingState>

export const messagingStateAtom = atomWithParsedMmkvStorage(
  'messaging',
  MessagingState.parse({
    inboxes: [],
    chats: [],
  }),
  MessagingState
)

export const inboxesAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.prop('inboxes')
)

export const chatsAtom = focusAtom(messagingStateAtom, (optic) =>
  optic.prop('chats')
)

export function oneChatAtom(chatId: ChatId) {
  return focusAtom(chatsAtom, (optic) =>
    optic.find((chat) => chat.id === chatId).optional()
  )
}

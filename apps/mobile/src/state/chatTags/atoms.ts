import {Array, Option, pipe} from 'effect'
import {atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import allChatsAtom from '../chat/atoms/allChatsAtom'
import chatShouldBeVisible from '../chat/utils/isChatActive'
import {
  addChatTag,
  type ChatTagId,
  ChatTagsState,
  deleteChatTag,
  emptyChatTagsState,
  pruneChatTagAssignments,
  setTagsForChat,
} from './domain'

export const chatTagsStateAtom = atomWithParsedMmkvStorage(
  'chatTagsState',
  emptyChatTagsState,
  ChatTagsState
)

export const pruneChatTagAssignmentsActionAtom = atom(
  null,
  (get, set, validChatIds: Parameters<typeof pruneChatTagAssignments>[1]) => {
    set(
      chatTagsStateAtom,
      pruneChatTagAssignments(get(chatTagsStateAtom), validChatIds)
    )
  }
)

export const chatTagsAtom = atom((get) => get(chatTagsStateAtom).tags)

export const selectedChatTagFiltersAtom = atom<ReadonlySet<ChatTagId>>(
  new Set<ChatTagId>()
)

export const addChatTagActionAtom = atom(null, (get, set, name: string) => {
  const [nextState, addedTag] = addChatTag(get(chatTagsStateAtom), name)
  set(chatTagsStateAtom, nextState)
  return Option.getOrUndefined(addedTag)
})

export const deleteChatTagActionAtom = atom(
  null,
  (get, set, tagId: ChatTagId) => {
    set(chatTagsStateAtom, deleteChatTag(get(chatTagsStateAtom), tagId))
    set(
      selectedChatTagFiltersAtom,
      (selectedTagIds: ReadonlySet<ChatTagId>): ReadonlySet<ChatTagId> =>
        new Set(
          pipe(
            selectedTagIds,
            Array.fromIterable,
            Array.filter((selectedTagId) => selectedTagId !== tagId)
          )
        )
    )
  }
)

export const setTagsForChatActionAtom = atom(
  null,
  (
    get,
    set,
    args: {
      readonly chatId: Parameters<typeof setTagsForChat>[0]['chatId']
      readonly tagIds: ReadonlySet<ChatTagId>
    }
  ) => {
    const chatExists = pipe(
      get(allChatsAtom),
      Array.flatten,
      Array.some(
        (chat) => chat.chat.id === args.chatId && chatShouldBeVisible(chat)
      )
    )
    if (!chatExists) return

    set(
      chatTagsStateAtom,
      setTagsForChat({
        state: get(chatTagsStateAtom),
        ...args,
      })
    )
  }
)

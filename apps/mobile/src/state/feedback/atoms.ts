import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {ChatToFeedbackItems} from './domain'
import {focusAtom} from 'jotai-optics'
import {type ChatId} from '@vexl-next/domain/dist/general/messaging'
import {
  type Feedback,
  type FeedbackFormId,
} from '@vexl-next/domain/dist/general/feedback'
import {type FocusAtomType} from '../../utils/atomUtils/FocusAtomType'
import {
  atom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {z} from 'zod'

export const chatsToFeedbacksStorageAtom = atomWithParsedMmkvStorage(
  'chatsToFeedbacksStorageAtom',
  {
    chatsToFeedbacks: [],
  },
  ChatToFeedbackItems
)

export const offerFeedbackDoneStorageAtom = atomWithParsedMmkvStorage(
  'offerFeedbackDoneStorageAtom',
  {
    offerFeedbackDone: false,
  },
  z.object({offerFeedbackDone: z.boolean().default(false)})
)

export type FeedbackForChatAtom = FocusAtomType<Feedback | undefined>

export function focusFeedbackForChatAtom(
  chatId: ChatId
): WritableAtom<Feedback | undefined, [SetStateAction<Feedback>], void> {
  return focusAtom(chatsToFeedbacksStorageAtom, (o) =>
    o
      .prop('chatsToFeedbacks')
      .find((one) => one.chatId === chatId)
      .prop('feedback')
  )
}

export const displayOfferCreationFeedbackAtom = atom<boolean>(false)

export const feedbackDoneAtom = focusAtom(offerFeedbackDoneStorageAtom, (o) =>
  o.prop('offerFeedbackDone')
)

export const deleteChatFeedbackEntryFromStorageByChatIdAtom = atom(
  null,
  (get, set, chatId: ChatId) => {
    const {chatsToFeedbacks} = get(chatsToFeedbacksStorageAtom)
    const filteredChatsToFeedbacks = chatsToFeedbacks.filter(
      (item) => item.chatId !== chatId
    )

    set(chatsToFeedbacksStorageAtom, {
      chatsToFeedbacks: filteredChatsToFeedbacks,
    })
  }
)

export const deleteChatFeedbackEntryFromStorageByFormIdAtom = atom(
  null,
  (get, set, formIdAtom: PrimitiveAtom<FeedbackFormId>) => {
    const formId = get(formIdAtom)
    const {chatsToFeedbacks} = get(chatsToFeedbacksStorageAtom)
    const filteredChatsToFeedbacks = chatsToFeedbacks.filter(
      (item) => item.feedback.formId !== formId
    )

    set(chatsToFeedbacksStorageAtom, {
      chatsToFeedbacks: filteredChatsToFeedbacks,
    })
  }
)

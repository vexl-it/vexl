import {Feedback} from '@vexl-next/domain/src/general/feedback'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {Schema} from 'effect/index'
import {atom, type Atom, type PrimitiveAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {type SetStateAction} from 'react'
import {generateInitialFeedback} from '../../components/UserFeedback/atoms'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'

export const newOfferFeedbackDoneStorageAtom = atomWithParsedMmkvStorage(
  'newOfferFeedbackDoneStorageAtom',
  {
    newOfferFeedbackDone: false,
  },
  Schema.Struct({newOfferFeedbackDone: Schema.Boolean})
)

export const newOfferFeedbackDoneAtom = focusAtom(
  newOfferFeedbackDoneStorageAtom,
  (o) => o.prop('newOfferFeedbackDone')
)

export const feedbacksForClosedChatsStorageAtom = atomWithParsedMmkvStorage(
  'chatClosedFeedbacksAtom',
  {feedbacks: {}},
  Schema.Struct({feedbacks: Schema.Record({key: ChatId, value: Feedback})})
)

export const feedbacksForClosedChatsAtom = focusAtom(
  feedbacksForClosedChatsStorageAtom,
  (o) => o.prop('feedbacks')
)

export function createFeedbackForChatAtom(
  chatIdAtom: Atom<ChatId>
): PrimitiveAtom<Feedback> {
  const initialFeedback = generateInitialFeedback('CHAT_RATING')
  return atom(
    (get) =>
      get(feedbacksForClosedChatsAtom)[get(chatIdAtom)] ?? initialFeedback,
    (get, set, update: SetStateAction<Feedback>) => {
      const newValue = getValueFromSetStateActionOfAtom(update)(
        () =>
          get(feedbacksForClosedChatsAtom)[get(chatIdAtom)] ?? initialFeedback
      )

      set(feedbacksForClosedChatsAtom, (old) => ({
        ...old,
        [get(chatIdAtom)]: newValue,
      }))
    }
  )
}

export const removeFeedbackRecordActionAtom = atom(
  null,
  (get, set, chatId: ChatId) => {
    set(feedbacksForClosedChatsAtom, (old) => {
      const {[chatId]: _, ...newValue} = old
      return newValue
    })
  }
)

import {createScope, molecule} from 'jotai-molecules'
import {
  type Feedback,
  generateFeedbackFormId,
  type ObjectionType,
} from '@vexl-next/domain/dist/general/feedback'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {privateApiAtom} from '../../../api'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import reportError from '../../../utils/reportError'
import {chatsToFeedbacksStorageAtom} from '../../../state/feedback/atoms'
import {chatMolecule} from '../../ChatDetailScreen/atoms'
import {focusAtom} from 'jotai-optics'

const dummyFeedback = {
  formId: generateFeedbackFormId(),
  stars: 0,
  objections: [],
  textComment: '',
}
export const dummyOfferFeedback: Feedback = {
  type: 'OFFER_RATING',
  ...dummyFeedback,
}
export const dummyChatFeedback: Feedback = {
  type: 'CHAT_RATING',
  ...dummyFeedback,
}

export const FeedbackScope = createScope<
  WritableAtom<Feedback, [SetStateAction<Feedback>], void>
>(atom<Feedback>(dummyChatFeedback))

export const feedbackMolecule = molecule((getMolecule, getScope) => {
  const feedbackAtom = getScope(FeedbackScope)
  const {chatAtom} = getMolecule(chatMolecule)

  const starRatingAtom = focusAtom(feedbackAtom, (o) => o.prop('stars'))
  const selectedObjectionsAtom = focusAtom(feedbackAtom, (o) =>
    o.prop('objections')
  )
  const textCommentAtom = focusAtom(feedbackAtom, (o) => o.prop('textComment'))
  const formIdAtom = focusAtom(feedbackAtom, (o) => o.prop('formId'))
  const currentFeedbackPageAtom = focusAtom(feedbackAtom, (o) => o.prop('type'))
  const feedbackFlowFinishedAtom = atom<boolean>(false)
  const submitTextCommentButtonDisabledAtom = atom((get) => {
    return (
      get(currentFeedbackPageAtom) === 'TEXT_COMMENT' &&
      get(textCommentAtom) === ''
    )
  })

  function createIsStarSelectedAtom(
    starOrderNumber: number
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    return atom(
      (get) => get(starRatingAtom) >= starOrderNumber,
      (get, set) => {
        const starRating = get(starRatingAtom)
        if (starOrderNumber !== starRating) {
          set(starRatingAtom, starOrderNumber)
        }
      }
    )
  }

  function createIsObjectionSelectedAtom(
    objection: ObjectionType
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> {
    return atom(
      (get) => get(selectedObjectionsAtom).includes(objection),
      (get, set, isSelected: SetStateAction<boolean>) => {
        const selectedObjections = get(selectedObjectionsAtom)
        const selected = getValueFromSetStateActionOfAtom(isSelected)(() =>
          get(selectedObjectionsAtom).includes(objection)
        )

        if (selected) {
          set(selectedObjectionsAtom, [...selectedObjections, objection])
        } else {
          set(
            selectedObjectionsAtom,
            selectedObjections.filter((p) => p !== objection)
          )
        }
      }
    )
  }

  const submitFeedbackAtom = atom(
    null,
    (get, set, isOfferCreationFeedback: boolean) => {
      const privateApi = get(privateApiAtom)
      const formId = get(formIdAtom)
      const currentPage = get(currentFeedbackPageAtom)
      const starRating = get(starRatingAtom)
      const objections = get(selectedObjectionsAtom)
      const textComment = get(textCommentAtom)

      return pipe(
        TE.Do,
        TE.chainW(() =>
          privateApi.user.submitFeedback({
            formId,
            type: currentPage,
            ...(starRating !== 0 && {stars: starRating}),
            ...(!isOfferCreationFeedback &&
              objections.length !== 0 && {objections: objections?.join(',')}),
            ...(!isOfferCreationFeedback &&
              textComment !== '' && {textComment}),
          })
        ),
        TE.match(
          (e) => {
            reportError('error', 'Error sending feedback', e)
            return false
          },
          () => {
            return true
          }
        )
      )()
    }
  )

  const submitOfferCreationFeedbackHandleUIAtom = atom(null, (get, set) => {
    return pipe(
      T.Do,
      T.map((r) => {
        set(feedbackFlowFinishedAtom, true)
        return r
      }),
      T.map(() => set(submitFeedbackAtom, false))
    )()
  })

  const submitChatFeedbackAndHandleUIAtom = atom(null, (get, set) => {
    const currentPage = get(currentFeedbackPageAtom)
    const formId = get(formIdAtom)
    const starRating = get(starRatingAtom)
    const objections = get(selectedObjectionsAtom)
    const textComment = get(textCommentAtom)
    const {chatsToFeedbacks} = get(chatsToFeedbacksStorageAtom)
    const chat = get(chatAtom)

    return pipe(
      TE.Do,
      TE.map((r) => {
        if (currentPage === 'TEXT_COMMENT') {
          set(feedbackFlowFinishedAtom, true)
        }
        const filteredChatsToFeedbacks = chatsToFeedbacks.filter(
          (item) => item.feedback.formId !== formId
        )

        // wee need to set state first regardless of api call success/failure
        // to not bother user with broken flow, error is still caught later
        set(chatsToFeedbacksStorageAtom, {
          chatsToFeedbacks: [
            ...filteredChatsToFeedbacks,
            {
              chatId: chat.id,
              feedback: {
                formId,
                stars: starRating,
                type:
                  currentPage === 'CHAT_RATING' ? 'OBJECTIONS' : 'TEXT_COMMENT',
                objections,
                textComment,
              },
            },
          ],
        })

        return r
      }),
      TE.map(() => set(submitFeedbackAtom, false))
    )()
  })

  return {
    starRatingAtom,
    createIsStarSelectedAtom,
    selectedObjectionsAtom,
    createIsObjectionSelectedAtom,
    formIdAtom,
    textCommentAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIAtom,
    submitOfferCreationFeedbackHandleUIAtom,
    feedbackFlowFinishedAtom,
    submitTextCommentButtonDisabledAtom,
  }
})

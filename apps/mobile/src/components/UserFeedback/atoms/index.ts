import {
  POSITIVE_STAR_RATING_THRESHOLD,
  generateFeedbackFormId,
  objectionTypeNegativeOptions,
  objectionTypePositiveOptions,
  type Feedback,
  type FeedbackType,
  type ObjectionType,
} from '@vexl-next/domain/src/general/feedback'
import {FeedbackFormId} from '@vexl-next/rest-api/src/services/feedback/contracts'
import {createScope, molecule} from 'bunshi/dist/react'
import {Effect, Schema} from 'effect'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {apiAtom} from '../../../api'
import {regionCodeAtom} from '../../../state/session/userDataAtoms'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import reportError from '../../../utils/reportError'

export function generateInitialFeedback(type: FeedbackType): Feedback {
  return {
    type,
    currentPage: type,
    formId: generateFeedbackFormId(),
    stars: 0,
    objections: [],
    textComment: '',
    finished: false,
  }
}

export const FeedbackScope = createScope<
  WritableAtom<Feedback, [SetStateAction<Feedback>], void>
>(atom<Feedback>(generateInitialFeedback('CHAT_RATING')))

export const feedbackMolecule = molecule((getMolecule, getScope) => {
  const feedbackAtom = getScope(FeedbackScope)
  const starRatingAtom = focusAtom(feedbackAtom, (o) => o.prop('stars'))
  const selectedObjectionsAtom = focusAtom(feedbackAtom, (o) =>
    o.prop('objections')
  )
  const textCommentAtom = focusAtom(feedbackAtom, (o) => o.prop('textComment'))
  const formIdAtom = focusAtom(feedbackAtom, (o) => o.prop('formId'))
  const currentFeedbackPageAtom = focusAtom(feedbackAtom, (o) =>
    o.prop('currentPage')
  )
  const chatFeedbackFinishedAtom = focusAtom(feedbackAtom, (o) =>
    o.prop('finished')
  )
  const feedbackFlowFinishedAtom = atom<boolean>(false)

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

  const submitFeedbackActionAtom = atom(
    null,
    (get, set, isOfferCreationFeedback: boolean) => {
      const api = get(apiAtom)
      const {formId, type, stars, objections, textComment} = get(feedbackAtom)
      const regionCode = get(regionCodeAtom)

      if (
        get(currentFeedbackPageAtom) === 'TEXT_COMMENT' &&
        get(textCommentAtom).trim() === ''
      ) {
        return Effect.void
      }

      return api.feedback
        .submitFeedback({
          body: {
            formId: Schema.decodeSync(FeedbackFormId)(formId),
            countryCode: regionCode,
            type: type === 'CHAT_RATING' ? 'trade' : 'create',
            ...(stars !== 0 && {stars}),
            ...(!isOfferCreationFeedback &&
              objections.length !== 0 && {
                objections: objections?.join(','),
              }),
            ...(!isOfferCreationFeedback &&
              textComment.trim() !== '' && {textComment}),
          },
        })
        .pipe(
          Effect.catchAll((e) =>
            Effect.sync(() => {
              reportError('error', new Error('Error sending feedback'), {e})
            })
          )
        )
    }
  )

  const submitOfferCreationFeedbackHandleUIActionAtom = atom(
    null,
    (get, set) => {
      return Effect.gen(function* (_) {
        set(feedbackFlowFinishedAtom, true)

        yield* _(set(submitFeedbackActionAtom, true))
      })
    }
  )

  const submitChatFeedbackAndHandleUIActionAtom = atom(null, (get, set) => {
    const {stars, objections} = get(feedbackAtom)
    const currentPage = get(currentFeedbackPageAtom)

    return Effect.gen(function* (_) {
      yield* _(set(submitFeedbackActionAtom, false))

      if (currentPage === 'TEXT_COMMENT') {
        set(feedbackFlowFinishedAtom, true)
      }

      if (currentPage === 'CHAT_RATING') {
        // we have to filter out previous objections if rating changed from positive -> negative and opposite
        if (
          (stars > POSITIVE_STAR_RATING_THRESHOLD &&
            objections.some((objection) =>
              objectionTypeNegativeOptions.includes(objection)
            )) ||
          (stars < POSITIVE_STAR_RATING_THRESHOLD &&
            objections.some((objection) =>
              objectionTypePositiveOptions.includes(objection)
            ))
        ) {
          set(selectedObjectionsAtom, [])
        }

        set(currentFeedbackPageAtom, 'OBJECTIONS')
      }

      if (currentPage === 'OBJECTIONS') {
        set(currentFeedbackPageAtom, 'TEXT_COMMENT')
      }
    })
  })

  return {
    starRatingAtom,
    createIsStarSelectedAtom,
    chatFeedbackFinishedAtom,
    selectedObjectionsAtom,
    createIsObjectionSelectedAtom,
    formIdAtom,
    textCommentAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIActionAtom,
    submitOfferCreationFeedbackHandleUIActionAtom,
    feedbackFlowFinishedAtom,
  }
})

import {Schema} from '@effect/schema'
import {
  POSITIVE_STAR_RATING_THRESHOLD,
  generateFeedbackFormId,
  objectionTypeNegativeOptions,
  objectionTypePositiveOptions,
  type Feedback,
  type FeedbackType,
  type ObjectionType,
} from '@vexl-next/domain/src/general/feedback'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {FeedbackFormId} from '@vexl-next/rest-api/src/services/feedback/contracts'
import {createScope, molecule} from 'bunshi/dist/react'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {privateApiAtom} from '../../../api'
import {regionCodeAtom} from '../../../state/session'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import reportError from '../../../utils/reportError'

export function generateInitialFeedback(type: FeedbackType): Feedback {
  return {
    type,
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
  const currentFeedbackPageAtom = focusAtom(feedbackAtom, (o) => o.prop('type'))
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

  const submitFeedbackAtom = atom(
    null,
    (get, set, isOfferCreationFeedback: boolean) => {
      const api = get(privateApiAtom)
      const {formId, type, stars, objections, textComment} = get(feedbackAtom)
      const regionCode = get(regionCodeAtom)

      if (
        get(currentFeedbackPageAtom) === 'TEXT_COMMENT' &&
        get(textCommentAtom).trim() === ''
      ) {
        return true
      }

      return pipe(
        TE.Do,
        TE.chainW(() =>
          effectToTaskEither(
            api.feedback.submitFeedback({
              body: {
                formId: Schema.decodeSync(FeedbackFormId)(formId),
                countryCode: regionCode,
                type: type === 'OFFER_RATING' ? 'trade' : 'create',
                ...(stars !== 0 && {stars}),
                ...(!isOfferCreationFeedback &&
                  objections.length !== 0 && {
                    objections: objections?.join(','),
                  }),
                ...(!isOfferCreationFeedback &&
                  textComment.trim() !== '' && {textComment}),
              },
            })
          )
        ),
        TE.match(
          (e) => {
            reportError('error', new Error('Error sending feedback'), {e})
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
    const {type, stars, objections} = get(feedbackAtom)

    return pipe(
      TE.Do,
      TE.map((r) => {
        if (type === 'TEXT_COMMENT') {
          set(feedbackFlowFinishedAtom, true)
        }

        if (type === 'CHAT_RATING') {
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

        if (type === 'OBJECTIONS') {
          set(currentFeedbackPageAtom, 'TEXT_COMMENT')
        }

        return r
      }),
      TE.map(() => set(submitFeedbackAtom, false))
    )()
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
    submitChatFeedbackAndHandleUIAtom,
    submitOfferCreationFeedbackHandleUIAtom,
    feedbackFlowFinishedAtom,
  }
})

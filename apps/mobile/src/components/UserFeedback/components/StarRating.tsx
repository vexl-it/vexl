import {StarRating as StarRatingInput} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {feedbackMolecule} from '../atoms'

function StarRating(): React.ReactElement {
  const {
    starRatingAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIActionAtom,
    submitOfferCreationFeedbackHandleUIActionAtom,
  } = useMolecule(feedbackMolecule)
  const [starRating, setStarRating] = useAtom(starRatingAtom)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const submitChatFeedbackAndHandleUI = useSetAtom(
    submitChatFeedbackAndHandleUIActionAtom
  )
  const submitOfferCreationFeedbackHandleUI = useSetAtom(
    submitOfferCreationFeedbackHandleUIActionAtom
  )

  return (
    <StarRatingInput
      value={starRating}
      onChange={(stars) => {
        setStarRating(stars)
        if (currentPage === 'OFFER_RATING') {
          Effect.runFork(submitOfferCreationFeedbackHandleUI())
        } else {
          Effect.runFork(submitChatFeedbackAndHandleUI())
        }
      }}
    />
  )
}

export default StarRating

import {
  objectionTypeNegativeOptions,
  objectionTypePositiveOptions,
  POSITIVE_STAR_RATING_THRESHOLD,
} from '@vexl-next/domain/src/general/feedback'
import {XStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React from 'react'
import {feedbackMolecule} from '../atoms'
import ObjectionCell from './ObjectionCell'

function Objections(): React.ReactElement {
  const {starRatingAtom} = useMolecule(feedbackMolecule)
  const starRating = useAtomValue(starRatingAtom)

  return (
    <XStack fw="wrap" ai="center" jc="center" gap="$3">
      {pipe(
        starRating >= POSITIVE_STAR_RATING_THRESHOLD
          ? objectionTypePositiveOptions
          : objectionTypeNegativeOptions,
        Array.map((objection) => (
          <ObjectionCell key={objection} objection={objection} />
        ))
      )}
    </XStack>
  )
}

export default Objections

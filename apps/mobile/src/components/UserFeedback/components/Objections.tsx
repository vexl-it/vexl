import {
  objectionTypeNegativeOptions,
  objectionTypePositiveOptions,
  POSITIVE_STAR_RATING_THRESHOLD,
} from '@vexl-next/domain/src/general/feedback'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {XStack} from 'tamagui'
import {feedbackMolecule} from '../atoms'
import ObjectionCell from './ObjectionCell'

function Objections(): JSX.Element {
  const {starRatingAtom} = useMolecule(feedbackMolecule)
  const starRating = useAtomValue(starRatingAtom)

  return (
    <XStack fw="wrap" ai="center" jc="center" space="$2">
      {starRating >= POSITIVE_STAR_RATING_THRESHOLD
        ? objectionTypePositiveOptions.map((objection) => (
            <ObjectionCell key={objection} objection={objection} />
          ))
        : objectionTypeNegativeOptions.map((objection) => (
            <ObjectionCell key={objection} objection={objection} />
          ))}
    </XStack>
  )
}

export default Objections

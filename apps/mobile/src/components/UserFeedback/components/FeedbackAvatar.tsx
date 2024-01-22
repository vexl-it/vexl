import {POSITIVE_STAR_RATING_THRESHOLD} from '@vexl-next/domain/src/general/feedback'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import SvgImage from '../../Image'
import anonymousAvatarHappyNoBackgroundSvg from '../../images/anonymousAvatarHappyNoBackgroundSvg'
import anonymousAvatarSadNoBackgroundSvg from '../../images/anonymousAvatarSadNoBackgroundSvg'
import {feedbackMolecule} from '../atoms'

function FeedbackAvatar(): JSX.Element {
  const {starRatingAtom} = useMolecule(feedbackMolecule)
  const starRating = useAtomValue(starRatingAtom)

  return (
    <SvgImage
      width={66}
      height={66}
      source={
        starRating >= POSITIVE_STAR_RATING_THRESHOLD || starRating === 0
          ? anonymousAvatarHappyNoBackgroundSvg
          : anonymousAvatarSadNoBackgroundSvg
      }
    />
  )
}

export default FeedbackAvatar

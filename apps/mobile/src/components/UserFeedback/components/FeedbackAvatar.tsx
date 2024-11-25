import {POSITIVE_STAR_RATING_THRESHOLD} from '@vexl-next/domain/src/general/feedback'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {goldenAvatarTypeAtom} from '../../../utils/preferences'
import SvgImage from '../../Image'
import anonymousAvatarHappyGoldenGlassesNoBackgroundSvg from '../../images/anonymousAvatarHappyGoldenGlassesNoBackgroundSvg'
import anonymousAvatarHappyNoBackgroundSvg from '../../images/anonymousAvatarHappyNoBackgroundSvg'
import anonymousAvatarSadGoldenGlassesNoBackgroundSvg from '../../images/anonymousAvatarSadGoldenGlassesNoBackgroundSvg'
import anonymousAvatarSadNoBackgroundSvg from '../../images/anonymousAvatarSadNoBackgroundSvg'
import {feedbackMolecule} from '../atoms'

function FeedbackAvatar(): JSX.Element {
  const {starRatingAtom} = useMolecule(feedbackMolecule)
  const starRating = useAtomValue(starRatingAtom)
  const goldenAvatarType = useAtomValue(goldenAvatarTypeAtom)

  const happyAvatar = goldenAvatarType
    ? anonymousAvatarHappyGoldenGlassesNoBackgroundSvg
    : anonymousAvatarHappyNoBackgroundSvg
  const sadAvatar = goldenAvatarType
    ? anonymousAvatarSadGoldenGlassesNoBackgroundSvg
    : anonymousAvatarSadNoBackgroundSvg

  return (
    <SvgImage
      width={66}
      height={66}
      source={
        starRating >= POSITIVE_STAR_RATING_THRESHOLD || starRating === 0
          ? happyAvatar
          : sadAvatar
      }
    />
  )
}

export default FeedbackAvatar

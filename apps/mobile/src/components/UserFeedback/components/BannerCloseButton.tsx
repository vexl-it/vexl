import {useMolecule} from 'jotai-molecules'
import {feedbackMolecule} from '../atoms'
import {useAtomValue, type PrimitiveAtom, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import SvgImage from '../../Image'
import closeSvg from '../../images/closeSvg'
import {getTokens, Stack} from 'tamagui'

interface Props {
  feedbackDoneAtom: PrimitiveAtom<boolean>
  hideCloseButton?: boolean
}

function BannerCloseButton({
  feedbackDoneAtom,
  hideCloseButton,
}: Props): JSX.Element | null {
  const {currentFeedbackPageAtom} = useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const setFeedbackDone = useSetAtom(feedbackDoneAtom)

  return currentPage !== 'OFFER_RATING' && !hideCloseButton ? (
    <TouchableOpacity
      onPress={() => {
        setFeedbackDone(true)
      }}
    >
      <SvgImage
        height={24}
        width={24}
        source={closeSvg}
        stroke={getTokens().color.greyOnBlack.val}
      />
    </TouchableOpacity>
  ) : (
    <Stack width={24} />
  )
}

export default BannerCloseButton

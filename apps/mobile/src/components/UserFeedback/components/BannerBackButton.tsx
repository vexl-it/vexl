import {TouchableOpacity} from 'react-native'
import SvgImage from '../../Image'
import backButtonSvg from '../../../images/backButtonSvg'
import {getTokens, Stack} from 'tamagui'
import {useAtom, useAtomValue} from 'jotai'
import {useMolecule} from 'jotai-molecules'
import {feedbackMolecule} from '../atoms'

function BannerBackButton(): JSX.Element {
  const {currentFeedbackPageAtom, feedbackFlowFinishedAtom} =
    useMolecule(feedbackMolecule)
  const feedbackFlowFinished = useAtomValue(feedbackFlowFinishedAtom)
  const [currentPage, setCurrentPage] = useAtom(currentFeedbackPageAtom)

  return currentPage !== 'CHAT_RATING' &&
    currentPage !== 'OFFER_RATING' &&
    !feedbackFlowFinished ? (
    <TouchableOpacity
      onPress={() => {
        setCurrentPage(
          currentPage === 'OBJECTIONS' ? 'CHAT_RATING' : 'OBJECTIONS'
        )
      }}
    >
      <SvgImage
        source={backButtonSvg}
        height={24}
        width={24}
        stroke={getTokens().color.greyOnBlack.val}
      />
    </TouchableOpacity>
  ) : (
    <Stack width={24} />
  )
}

export default BannerBackButton

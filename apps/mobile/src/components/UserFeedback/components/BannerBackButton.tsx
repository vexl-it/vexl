import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import backButtonSvg from '../../../images/backButtonSvg'
import SvgImage from '../../Image'
import {feedbackMolecule} from '../atoms'

function BannerBackButton(): React.ReactElement {
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

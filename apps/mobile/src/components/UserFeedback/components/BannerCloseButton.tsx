import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import SvgImage from '../../Image'
import closeSvg from '../../images/closeSvg'
import {feedbackMolecule} from '../atoms'

interface Props {
  hideCloseButton?: boolean
}

function BannerCloseButton({
  hideCloseButton,
}: Props): React.ReactElement | null {
  const {currentFeedbackPageAtom, chatFeedbackFinishedAtom} =
    useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const setFeedbackDone = useSetAtom(chatFeedbackFinishedAtom)

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

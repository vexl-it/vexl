import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Stack, getTokens} from 'tamagui'
import {showDonationPromptGiveLoveActionAtom} from '../../DonationPrompt/atoms'
import SvgImage from '../../Image'
import closeSvg from '../../images/closeSvg'
import {feedbackMolecule} from '../atoms'

interface Props {
  hideCloseButton?: boolean
}

function BannerCloseButton({hideCloseButton}: Props): JSX.Element | null {
  const {currentFeedbackPageAtom, chatFeedbackFinishedAtom} =
    useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const setFeedbackDone = useSetAtom(chatFeedbackFinishedAtom)
  const showDonationPromptGiveLove = useSetAtom(
    showDonationPromptGiveLoveActionAtom
  )

  return currentPage !== 'OFFER_RATING' && !hideCloseButton ? (
    <TouchableOpacity
      onPress={() => {
        setFeedbackDone(true)
        Effect.runFork(showDonationPromptGiveLove())
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

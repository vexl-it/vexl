import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens} from 'tamagui'
import SvgImage from '../../Image'
import {feedbackMolecule} from '../atoms'
import starSvg from '../images/starSvg'

interface Props {
  starOrderNumber: number
}

function TouchableStar({starOrderNumber}: Props): JSX.Element {
  const {
    createIsStarSelectedAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIActionAtom,
    submitOfferCreationFeedbackHandleUIActionAtom,
  } = useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const submitChatFeedbackAndHandleUI = useSetAtom(
    submitChatFeedbackAndHandleUIActionAtom
  )
  const submitOfferCreationFeedbackHandleUI = useSetAtom(
    submitOfferCreationFeedbackHandleUIActionAtom
  )
  const [isSelected, select] = useAtom(
    useMemo(
      () => createIsStarSelectedAtom(starOrderNumber),
      [createIsStarSelectedAtom, starOrderNumber]
    )
  )

  return (
    <TouchableOpacity
      onPress={() => {
        select(!isSelected)
        if (currentPage === 'OFFER_RATING') {
          Effect.runFork(submitOfferCreationFeedbackHandleUI())
        } else {
          Effect.runFork(submitChatFeedbackAndHandleUI())
        }
      }}
    >
      <SvgImage
        fill={isSelected ? getTokens().color.main.val : 'none'}
        source={starSvg}
      />
    </TouchableOpacity>
  )
}

export default TouchableStar

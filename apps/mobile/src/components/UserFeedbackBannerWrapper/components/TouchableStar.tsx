import {useMemo} from 'react'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import SvgImage from '../../Image'
import {TouchableOpacity} from 'react-native'
import {getTokens} from 'tamagui'
import starSvg from '../images/starSvg'
import {useMolecule} from 'jotai-molecules'
import {feedbackMolecule} from '../atoms'

interface Props {
  starOrderNumber: number
}

function TouchableStar({starOrderNumber}: Props): JSX.Element {
  const {
    createIsStarSelectedAtom,
    currentFeedbackPageAtom,
    submitChatFeedbackAndHandleUIAtom,
    submitOfferCreationFeedbackHandleUIAtom,
  } = useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const submitChatFeedbackAndHandleUI = useSetAtom(
    submitChatFeedbackAndHandleUIAtom
  )
  const submitOfferCreationFeedbackHandleUI = useSetAtom(
    submitOfferCreationFeedbackHandleUIAtom
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
          void submitOfferCreationFeedbackHandleUI()
        } else {
          void submitChatFeedbackAndHandleUI()
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

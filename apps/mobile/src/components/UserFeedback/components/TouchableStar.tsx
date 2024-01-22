import {useMolecule} from 'bunshi/dist/react'
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

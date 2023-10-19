import {useMolecule} from 'jotai-molecules'
import {feedbackMolecule} from '../atoms'
import {useAtomValue, type PrimitiveAtom, useSetAtom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import SvgImage from '../../Image'
import closeSvg from '../../images/closeSvg'
import {getTokens, Stack} from 'tamagui'
import {deleteChatFeedbackEntryFromStorageByFormIdAtom} from '../../../state/feedback/atoms'

interface Props {
  feedbackDoneAtom: PrimitiveAtom<boolean>
}

function BannerCloseButton({feedbackDoneAtom}: Props): JSX.Element | null {
  const {currentFeedbackPageAtom, formIdAtom} = useMolecule(feedbackMolecule)
  const currentPage = useAtomValue(currentFeedbackPageAtom)
  const setFeedbackDone = useSetAtom(feedbackDoneAtom)
  const deleteChatFeedbackEntryFromStorage = useSetAtom(
    deleteChatFeedbackEntryFromStorageByFormIdAtom
  )

  return currentPage !== 'OFFER_RATING' ? (
    <TouchableOpacity
      onPress={() => {
        setFeedbackDone(true)
        deleteChatFeedbackEntryFromStorage(formIdAtom)
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

import {Modal} from 'react-native'
import {Stack, Text} from 'tamagui'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useMolecule} from 'jotai-molecules'
import {useAtomValue} from 'jotai'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import CreateOfferProgress from './CreateOfferProgress'

interface Props {
  loadingTitle: string
  loadingDoneTitle: string
  loadingSubtitle: string
  loadingDoneSubtitle: string
}

function OfferInProgress({
  loadingTitle,
  loadingDoneTitle,
  loadingSubtitle,
  loadingDoneSubtitle,
}: Props): JSX.Element {
  const {bottom} = useSafeAreaInsets()
  const {encryptingOfferAtom, modifyOfferLoaderTitleAtom, loadingAtom} =
    useMolecule(offerFormMolecule)
  const encryptingOffer = useAtomValue(encryptingOfferAtom)
  const loaderTitle = useAtomValue(modifyOfferLoaderTitleAtom)
  const loading = useAtomValue(loadingAtom)

  return (
    <Modal animationType="fade" transparent visible={encryptingOffer}>
      <Stack f={1} pb={bottom} jc="flex-end" bc={'rgba(0,0,0,0.6)'}>
        <Stack mb={bottom} p="$4" backgroundColor="$white" br="$4">
          <Text pb="$4" fos={32} ff="$heading">
            {loading ? loadingTitle : loadingDoneTitle}
          </Text>
          <CreateOfferProgress
            leftText={
              loading ? loaderTitle?.loadingText : loaderTitle?.notLoadingText
            }
          />
          {loadingSubtitle && loadingDoneSubtitle && (
            <Text pt="$4" fos={18} col="$greyOnWhite">
              {loading ? loadingSubtitle : loadingDoneSubtitle}
            </Text>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default OfferInProgress

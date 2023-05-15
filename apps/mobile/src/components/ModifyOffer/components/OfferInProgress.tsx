import {ActivityIndicator, Modal} from 'react-native'
import {Stack, Text} from 'tamagui'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useMolecule} from 'jotai-molecules'
import {useAtomValue} from 'jotai'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

interface Props {
  loading: boolean
  loaderTitle?: string
  subtitle?: string
  title: string
  visible: boolean
}

function OfferInProgress({
  loading,
  subtitle,
  title,
  visible,
}: Props): JSX.Element {
  const {bottom} = useSafeAreaInsets()
  const {createOfferLoaderTitleAtom} = useMolecule(offerFormMolecule)
  const loaderTitle = useAtomValue(createOfferLoaderTitleAtom)

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Stack f={1} pb={bottom} jc="flex-end" bc={'rgba(0,0,0,0.6)'}>
        <Stack mb={bottom} p="$4" backgroundColor="$white" br="$4">
          <Text pb="$4" fos={32} ff="$heading">
            {title}
          </Text>
          {loading && <ActivityIndicator />}
          {loaderTitle && (
            <Text ff="$body600" fos={14} col="$black">
              {loading ? loaderTitle.loadingText : loaderTitle.notLoadingText}
            </Text>
          )}
          {subtitle && (
            <Text pt="$4" fos={18} col="$greyOnWhite">
              {subtitle}
            </Text>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default OfferInProgress

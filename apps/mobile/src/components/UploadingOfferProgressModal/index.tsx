import {Modal} from 'react-native'
import {Stack, Text} from 'tamagui'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useAtomValue} from 'jotai'
import ProgressIndicator from './components/ProgressIndicator'
import {uploadingProgressDataForRootElement} from './atoms'

function UploadingOfferProgressModal(): JSX.Element {
  const {bottom} = useSafeAreaInsets()

  const data = useAtomValue(uploadingProgressDataForRootElement)

  return (
    <Modal animationType="fade" transparent visible={data.isVisible}>
      <Stack f={1} pb={bottom} jc="flex-end" bc={'rgba(0,0,0,0.6)'}>
        <Stack mb={bottom} p="$4" backgroundColor="$white" br="$4">
          <Text col="$black" pb="$4" fos={32} ff="$heading">
            {data.title}
          </Text>
          <ProgressIndicator />
          {data.bottomText && (
            <Text pt="$4" fos={18} col="$greyOnWhite">
              {data.bottomText}
            </Text>
          )}
        </Stack>
      </Stack>
    </Modal>
  )
}

export default UploadingOfferProgressModal

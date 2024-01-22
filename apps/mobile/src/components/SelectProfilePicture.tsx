import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {useAtomValue, useSetAtom, type PrimitiveAtom} from 'jotai'
import {TouchableWithoutFeedback, View, useWindowDimensions} from 'react-native'
import {Image, Stack} from 'tamagui'
import {selectImageActionAtom} from '../state/selectImageActionAtom'
import SvgImage from './Image'
import MiniCameraSvg from './LoginFlow/components/PhotoScreen/images/miniCameraSvg'
import selectIconSvg from './LoginFlow/components/PhotoScreen/images/selectIconSvg'

interface Props {
  selectedImageUriAtom: PrimitiveAtom<UriString | undefined>
}

function SelectProfilePicture({selectedImageUriAtom}: Props): JSX.Element {
  const selectImage = useSetAtom(selectImageActionAtom)
  const selectedImageUri = useAtomValue(selectedImageUriAtom)
  const {width} = useWindowDimensions()

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        selectImage(selectedImageUriAtom)
      }}
    >
      {selectedImageUri ? (
        <View>
          <Stack>
            <Image
              height={width / 2}
              width={width / 2}
              br="$10"
              source={{
                uri: selectedImageUri,
              }}
            />
            <Stack pos="absolute" t="$-4" r="$-4" width={32} h={32} zi="$1">
              <SvgImage source={MiniCameraSvg} />
            </Stack>
          </Stack>
        </View>
      ) : (
        <Stack w={128} h={128}>
          <SvgImage source={selectIconSvg} />
        </Stack>
      )}
    </TouchableWithoutFeedback>
  )
}

export default SelectProfilePicture

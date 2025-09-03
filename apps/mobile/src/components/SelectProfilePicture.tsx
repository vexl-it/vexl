import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {useAtom, useSetAtom, type PrimitiveAtom} from 'jotai'
import React from 'react'
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native'
import {Image, Stack, getTokens} from 'tamagui'
import {selectImageActionAtom} from '../state/selectImageActionAtom'
import SvgImage from './Image'
import selectIconSvg from './LoginFlow/components/PhotoScreen/images/selectIconSvg'
import closeSvg from './images/closeSvg'

interface Props {
  selectedImageUriAtom: PrimitiveAtom<UriString | undefined>
}

function SelectProfilePicture({
  selectedImageUriAtom,
}: Props): React.ReactElement {
  const selectImage = useSetAtom(selectImageActionAtom)
  const [selectedImageUri, setSelectedImageUri] = useAtom(selectedImageUriAtom)
  const {width} = useWindowDimensions()

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        selectImage(selectedImageUriAtom)
      }}
    >
      {selectedImageUri ? (
        <Stack>
          <Image
            height={width / 2}
            width={width / 2}
            br="$10"
            source={{
              uri: selectedImageUri,
            }}
          />
          <Stack
            pos="absolute"
            t="$-3"
            r="$-3"
            width={32}
            h={32}
            zi="$1"
            br={32}
            bc="$main"
          >
            <Stack f={1} ai="center" jc="center">
              <TouchableOpacity
                onPress={() => {
                  setSelectedImageUri(undefined)
                }}
              >
                <SvgImage
                  height={20}
                  width={20}
                  stroke={getTokens().color.blackAccent1.val}
                  source={closeSvg}
                />
              </TouchableOpacity>
            </Stack>
          </Stack>
        </Stack>
      ) : (
        <Stack w={128} h={128}>
          <SvgImage source={selectIconSvg} />
        </Stack>
      )}
    </TouchableWithoutFeedback>
  )
}

export default SelectProfilePicture

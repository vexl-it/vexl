import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import SvgImage from '../../Image'
import locationSvg from '../../images/locationSvg'

interface Props {
  onPress: (data: LocationSuggestion) => void
  atom: Atom<LocationSuggestion>
}

function LocationCell({atom, onPress}: Props): React.ReactElement {
  const data = useAtomValue(atom)

  return (
    <TouchableOpacity
      onPress={() => {
        onPress(data)
      }}
    >
      <XStack ai="flex-start" pt="$4">
        <SvgImage source={locationSvg} stroke={getTokens().color.white.val} />
        <Stack f={1} ml="$4" bbw={1} bbc="$grey" pb="$4">
          <Text pb="$1" col="$white" fos={18} fontFamily="$body400">
            {data.userData.suggestFirstRow}
          </Text>
          <Text col="$greyOnBlack" fos={14} ff="$body400">
            {data.userData.suggestSecondRow}
          </Text>
        </Stack>
      </XStack>
    </TouchableOpacity>
  )
}

export default LocationCell

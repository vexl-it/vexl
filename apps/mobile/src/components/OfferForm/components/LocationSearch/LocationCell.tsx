import {Stack, Text, XStack} from 'tamagui'
import SvgImage from '../../../Image'
import locationSvg from '../../../images/locationSvg'
import {TouchableOpacity} from 'react-native'
import {type LocationSuggestion} from '@vexl-next/rest-api/dist/services/location/contracts'
import {
  type Atom,
  type PrimitiveAtom,
  useAtomValue,
  useSetAtom,
  type WritableAtom,
} from 'jotai'

interface Props {
  setOfferLocationActionAtom: WritableAtom<
    null,
    [locationSuggestionAtom: Atom<LocationSuggestion>],
    void
  >
  locationSuggestionAtom: Atom<LocationSuggestion>
  locationSuggestionsAtom: PrimitiveAtom<LocationSuggestion[]>
  onPress: () => void
}

function LocationCell({
  setOfferLocationActionAtom,
  locationSuggestionAtom,
  locationSuggestionsAtom,
  onPress,
}: Props): JSX.Element {
  const {
    userData: {suggestFirstRow, suggestSecondRow},
  } = useAtomValue(locationSuggestionAtom)
  const setOfferLocation = useSetAtom(setOfferLocationActionAtom)
  const setLocationSuggestions = useSetAtom(locationSuggestionsAtom)

  return (
    <TouchableOpacity
      onPress={() => {
        setOfferLocation(locationSuggestionAtom)
        setLocationSuggestions([])
        onPress()
      }}
    >
      <XStack ai="flex-start" pt="$4">
        <SvgImage source={locationSvg} />
        <Stack f={1} ml="$4" bbw={1} bbc="$grey" pb="$4">
          <Text pb="$1" col="$white" fos={18} fontFamily="$body400">
            {suggestFirstRow}
          </Text>
          <Text col="$greyOnBlack" fos={14} ff="$body400">
            {suggestSecondRow}
          </Text>
        </Stack>
      </XStack>
    </TouchableOpacity>
  )
}

export default LocationCell

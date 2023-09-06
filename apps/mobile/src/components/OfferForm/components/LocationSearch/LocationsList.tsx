import {Stack} from 'tamagui'
import {FlatList} from 'react-native'
import {type LocationSuggestion} from '@vexl-next/rest-api/dist/services/location/contracts'
import LocationCell from './LocationCell'
import {type Atom, type PrimitiveAtom, type WritableAtom} from 'jotai'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import {useCallback} from 'react'

interface Props {
  setOfferLocationActionAtom: WritableAtom<
    null,
    [locationSuggestionAtom: Atom<LocationSuggestion>],
    void
  >
  locationSuggestionsAtom: PrimitiveAtom<LocationSuggestion[]>
  locationSuggestionsAtoms: Array<Atom<LocationSuggestion>>
  onClose: () => void
}

function LocationsList({
  setOfferLocationActionAtom,
  locationSuggestionsAtoms,
  locationSuggestionsAtom,
  onClose,
}: Props): JSX.Element {
  const renderItem = useCallback(
    ({item}: {item: Atom<LocationSuggestion>}) => (
      <LocationCell
        setOfferLocationActionAtom={setOfferLocationActionAtom}
        locationSuggestionAtom={item}
        locationSuggestionsAtom={locationSuggestionsAtom}
        onPress={onClose}
      />
    ),
    [locationSuggestionsAtom, onClose, setOfferLocationActionAtom]
  )

  return (
    <Stack pt={'$2'}>
      <FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        keyExtractor={atomKeyExtractor}
        data={locationSuggestionsAtoms}
        renderItem={renderItem}
      />
    </Stack>
  )
}

export default LocationsList

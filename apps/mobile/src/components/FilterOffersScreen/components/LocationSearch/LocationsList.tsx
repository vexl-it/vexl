import {Stack} from 'tamagui'
import {FlatList} from 'react-native'
import {type LocationSuggestion} from '@vexl-next/rest-api/dist/services/location/contracts'
import LocationCell from './LocationCell'
import {type Atom} from 'jotai'
import atomKeyExtractor from '../../../../utils/atomUtils/atomKeyExtractor'
import {useCallback} from 'react'

interface Props {
  locationSuggestionsAtoms: Array<Atom<LocationSuggestion>>
  onClose: () => void
}

function LocationsList({
  locationSuggestionsAtoms,
  onClose,
}: Props): JSX.Element {
  const renderItem = useCallback(
    ({item}: {item: Atom<LocationSuggestion>}) => (
      <LocationCell locationSuggestionAtom={item} onPress={onClose} />
    ),
    [onClose]
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

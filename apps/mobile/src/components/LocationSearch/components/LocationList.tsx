import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {useAtomValue, type Atom} from 'jotai'
import {useCallback} from 'react'
import {FlatList} from 'react-native'
import {Stack, Text} from 'tamagui'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useLocationSearchMolecule} from '../molecule'
import LocationCell from './LocationListItem'

interface Props {
  onPress: ({
    locationData,
    searchQuery,
  }: {
    locationData: LocationSuggestion
    searchQuery: string
  }) => void
}

function LocationsList({onPress}: Props): JSX.Element {
  const {t} = useTranslation()
  const {searchResultsAtomsAtom, searchQueryAtom} = useLocationSearchMolecule()
  const searchQuery = useAtomValue(searchQueryAtom)
  const searchResultsAtoms = useAtomValue(searchResultsAtomsAtom)

  const renderItem = useCallback(
    ({item}: {item: Atom<LocationSuggestion>}): JSX.Element => {
      return (
        <LocationCell
          atom={item}
          onPress={(locationData) => {
            onPress({locationData, searchQuery})
          }}
        />
      )
    },
    [onPress, searchQuery]
  )

  return (
    <Stack pt="$2">
      {searchResultsAtoms.length === 0 && (
        <Text mt="$10" ta="center" col="$greyOnBlack">
          {t('common.noResults')}
        </Text>
      )}
      <FlatList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        keyExtractor={atomKeyExtractor}
        data={searchResultsAtoms}
        renderItem={renderItem}
      />
    </Stack>
  )
}

export default LocationsList

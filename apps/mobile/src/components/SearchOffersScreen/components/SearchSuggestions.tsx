import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {FlatList} from 'react-native'
import {Stack} from 'tamagui'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {previousSearchToDisplayAtomsAtom} from '../atoms/previousSearchesAtom'
import SearchSuggestionItem from './SearchSuggestionItem'

function renderItem({item}: {item: Atom<string>}): JSX.Element {
  return <SearchSuggestionItem atom={item} />
}

function ItemSeparatorComponent(): JSX.Element {
  return <Stack h={2} bc="$greyAccent1" />
}

function SearchSuggestions(): JSX.Element {
  const previousSearchesAtoms = useAtomValue(previousSearchToDisplayAtomsAtom)

  return (
    <Stack flex={1}>
      <FlatList
        keyboardShouldPersistTaps="always"
        data={previousSearchesAtoms}
        ItemSeparatorComponent={ItemSeparatorComponent}
        renderItem={renderItem}
        keyExtractor={atomKeyExtractor}
      />
    </Stack>
  )
}

export default SearchSuggestions

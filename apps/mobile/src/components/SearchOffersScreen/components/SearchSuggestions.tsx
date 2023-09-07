import {Stack} from 'tamagui'
import {FlatList} from 'react-native'
import {type Atom, useAtomValue} from 'jotai'
import {previousSearchToDisplayAtomsAtom} from '../atoms/previousSearchesAtom'
import SearchSuggestionItem from './SearchSuggestionItem'
import React from 'react'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'

function renderItem({item}: {item: Atom<string>}): JSX.Element {
  return <SearchSuggestionItem atom={item} />
}

function ItemSeparatorComponent(): JSX.Element {
  return <Stack h={2} bc={'$greyAccent1'} />
}

function SearchSuggestions(): JSX.Element {
  const previousSearchesAtoms = useAtomValue(previousSearchToDisplayAtomsAtom)

  return (
    <Stack flex={1}>
      <FlatList
        keyboardShouldPersistTaps={'always'}
        data={previousSearchesAtoms}
        ItemSeparatorComponent={ItemSeparatorComponent}
        renderItem={renderItem}
        keyExtractor={atomKeyExtractor}
      />
    </Stack>
  )
}

export default SearchSuggestions

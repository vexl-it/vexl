import Screen from '../Screen'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import React, {useCallback} from 'react'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {XStack, YStack} from 'tamagui'
import SearchInput from './components/SearchInput'
import {useSetAtom, useStore} from 'jotai'
import SearchSuggestions from './components/SearchSuggestions'
import submitSearchActionAtom from './atoms/submitSearchActionAtom'
import {searchTextAtom} from './atoms/searchTextAtom'
import {useFocusEffect} from '@react-navigation/native'
import magnifyingGlass from '../images/magnifyingGlass'
import {offersFilterTextFromStorageAtom} from '../../state/marketplace/filterAtoms'

function SearchOffersScreen(): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const setSearchText = useSetAtom(searchTextAtom)
  const submitSearch = useSetAtom(submitSearchActionAtom)
  const store = useStore()

  useFocusEffect(
    useCallback(() => {
      setSearchText(store.get(offersFilterTextFromStorageAtom) ?? '')
    }, [setSearchText, store])
  )

  return (
    <Screen>
      <YStack f={1}>
        <XStack p="$2" pb={0} alignItems="center" space="$2">
          <IconButton
            height={60}
            variant="dark"
            icon={closeSvg}
            onPress={safeGoBack}
          />
          <SearchInput />
          <IconButton
            height={60}
            onPress={submitSearch}
            variant="secondary"
            icon={magnifyingGlass}
          />
        </XStack>
        <SearchSuggestions />
      </YStack>
    </Screen>
  )
}

export default SearchOffersScreen

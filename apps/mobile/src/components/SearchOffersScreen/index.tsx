import {useFocusEffect} from '@react-navigation/native'
import {useSetAtom, useStore} from 'jotai'
import React, {useCallback} from 'react'
import {XStack, YStack} from 'tamagui'
import {offersFilterTextFromStorageAtom} from '../../state/marketplace/filterAtoms'
import useSafeGoBack from '../../utils/useSafeGoBack'
import IconButton from '../IconButton'
import Screen from '../Screen'
import closeSvg from '../images/closeSvg'
import magnifyingGlass from '../images/magnifyingGlass'
import {searchTextAtom} from './atoms/searchTextAtom'
import submitSearchActionAtom from './atoms/submitSearchActionAtom'
import SearchInput from './components/SearchInput'
import SearchSuggestions from './components/SearchSuggestions'

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

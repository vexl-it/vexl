import Screen from '../Screen'
import IconButton from '../IconButton'
import closeSvg from '../images/closeSvg'
import React, {useCallback} from 'react'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {XStack, YStack} from 'tamagui'
import SearchInput from './components/SearchInput'
import {useSetAtom, useStore} from 'jotai'
import SearchSuggestions from './components/SearchSuggestions'
import Button from '../Button'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {clearSearchActionAtom} from './atoms/submitSearchActionAtom'
import {searchTextAtom} from './atoms/searchTextAtom'
import {useFocusEffect} from '@react-navigation/native'
import {focusTextFilterAtom} from '../FilterOffersScreen/atom'

function SearchOffersScreen(): JSX.Element {
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const setSearchText = useSetAtom(searchTextAtom)
  const clearSearch = useSetAtom(clearSearchActionAtom)
  const store = useStore()

  useFocusEffect(
    useCallback(() => {
      setSearchText(store.get(focusTextFilterAtom) ?? '')
    }, [setSearchText, store])
  )

  return (
    <Screen>
      <YStack f={1}>
        <XStack p={'$2'} pb={0} alignItems={'center'} space={'$2'}>
          <IconButton
            height={60}
            variant="dark"
            icon={closeSvg}
            onPress={safeGoBack}
          />
          <SearchInput />
          <Button
            onPress={clearSearch}
            size={'large'}
            variant={'primary'}
            text={t('common.reset')}
          />
        </XStack>
        <SearchSuggestions />
      </YStack>
    </Screen>
  )
}

export default SearchOffersScreen

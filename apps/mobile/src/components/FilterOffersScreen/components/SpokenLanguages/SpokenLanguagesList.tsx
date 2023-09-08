import {FlatList} from 'react-native'
import {Stack} from 'tamagui'
import React, {useCallback} from 'react'
import {
  type SpokenLanguage,
  spokenLanguagesOptions,
} from '@vexl-next/domain/dist/general/offers'
import SpokenLanguagesListItem from './SpokenLanguagesListItem'
import {createIsThisLanguageSelectedAtom} from '../../atom'

function ItemSeparatorComponent(): JSX.Element {
  return <Stack h={2} bc={'$greyAccent1'} />
}

function SpokenLanguagesList(): JSX.Element {
  const renderItem = useCallback(
    ({item}: {item: SpokenLanguage}): JSX.Element => (
      <SpokenLanguagesListItem
        createIsThisLanguageSelectedAtom={createIsThisLanguageSelectedAtom}
        spokenLanguage={item}
      />
    ),
    []
  )

  return (
    <FlatList
      data={spokenLanguagesOptions}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparatorComponent}
    />
  )
}

export default SpokenLanguagesList

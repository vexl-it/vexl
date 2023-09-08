import {FlatList} from 'react-native'
import {Stack} from 'tamagui'
import React, {useCallback} from 'react'
import {type SetStateAction, type WritableAtom} from 'jotai'
import {
  type SpokenLanguage,
  spokenLanguagesOptions,
} from '@vexl-next/domain/dist/general/offers'
import SpokenLanguagesListItem from './SpokenLanguagesListItem'

interface Props {
  createIsThisLanguageSelectedAtom: (
    spokenLanguageAtom: SpokenLanguage
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

function ItemSeparatorComponent(): JSX.Element {
  return <Stack h={2} bc={'$greyAccent1'} />
}

function SpokenLanguagesList({
  createIsThisLanguageSelectedAtom,
}: Props): JSX.Element {
  const renderItem = useCallback(
    ({item}: {item: SpokenLanguage}): JSX.Element => (
      <SpokenLanguagesListItem
        createIsThisLanguageSelectedAtom={createIsThisLanguageSelectedAtom}
        spokenLanguage={item}
      />
    ),
    [createIsThisLanguageSelectedAtom]
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

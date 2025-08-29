import {
  spokenLanguagesOptions,
  type SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {type SetStateAction, type WritableAtom} from 'jotai'
import React, {useCallback} from 'react'
import {FlatList} from 'react-native'
import {Stack} from 'tamagui'
import SpokenLanguagesListItem from './SpokenLanguagesListItem'

interface Props {
  createIsThisLanguageSelectedAtom: (
    spokenLanguageAtom: SpokenLanguage
  ) => WritableAtom<boolean, [SetStateAction<boolean>], void>
}

function ItemSeparatorComponent(): React.ReactElement {
  return <Stack h={2} bc="$greyAccent1" />
}

function SpokenLanguagesList({
  createIsThisLanguageSelectedAtom,
}: Props): React.ReactElement {
  const renderItem = useCallback(
    ({item}: {item: SpokenLanguage}): React.ReactElement => (
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

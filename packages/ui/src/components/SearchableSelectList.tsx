import {Array} from 'effect'
import type {SetStateAction, WritableAtom} from 'jotai'
import React, {useCallback} from 'react'
import {FlatList} from 'react-native'

import {EmptyState} from './EmptyState'
import {SearchBar} from './SearchBar'
import {SelectableItem} from './SelectableItem'
import {useKeyboardAwareFooterListPadding} from './useKeyboardAwareFooterListPadding'

export interface SearchableSelectListProps<T> {
  readonly items: readonly T[]
  readonly keyExtractor: (item: T) => string
  readonly getLabel: (item: T) => string
  readonly getNote?: (item: T) => string
  readonly selectedKey?: string
  readonly onSelect: (item: T) => void
  readonly searchValueAtom: WritableAtom<string, [SetStateAction<string>], void>
  readonly searchPlaceholder?: string
  readonly emptyTitle: string
  readonly emptyDescription?: string
}

export function SearchableSelectList<T>({
  items,
  keyExtractor,
  getLabel,
  getNote,
  selectedKey,
  onSelect,
  searchValueAtom,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
}: SearchableSelectListProps<T>): React.JSX.Element {
  const listPaddingBottom = useKeyboardAwareFooterListPadding()

  const renderItem = useCallback(
    ({item}: {readonly item: T}) => (
      <SelectableItem
        label={getLabel(item)}
        note={getNote?.(item)}
        selected={keyExtractor(item) === selectedKey}
        onPress={() => {
          onSelect(item)
        }}
      />
    ),
    [getLabel, getNote, keyExtractor, onSelect, selectedKey]
  )

  return (
    <>
      <SearchBar
        valueAtom={searchValueAtom}
        placeholder={searchPlaceholder}
        marginBottom="$4"
      />
      {Array.isNonEmptyReadonlyArray(items) ? (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: listPaddingBottom}}
        />
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </>
  )
}

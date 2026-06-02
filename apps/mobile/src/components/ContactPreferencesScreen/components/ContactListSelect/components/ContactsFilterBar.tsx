import {FilterBar, type FilterBarItem, Stack} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import React, {useCallback} from 'react'
import {type ContactsFilter} from '../../../../../state/contacts/domain'

export default function ContactsFilterBar({
  items,
  selectedFilter,
  onSelectedFilterChange,
}: {
  readonly items: ReadonlyArray<FilterBarItem<ContactsFilter>>
  readonly selectedFilter: ContactsFilter
  readonly onSelectedFilterChange: (filter: ContactsFilter) => void
}): React.ReactElement {
  const handleSelectedValuesChange = useCallback(
    (values: ReadonlySet<ContactsFilter>) => {
      pipe(
        Array.fromIterable(values),
        Array.findFirst((value) => value !== selectedFilter),
        Option.getOrElse(() => selectedFilter),
        onSelectedFilterChange
      )
    },
    [onSelectedFilterChange, selectedFilter]
  )

  return (
    <Stack height="$11" justifyContent="center">
      <FilterBar
        items={items}
        selectedValues={new Set([selectedFilter])}
        onSelectedValuesChange={handleSelectedValuesChange}
        containerStyle={{marginLeft: '$5'}}
      />
    </Stack>
  )
}

import {Stack, Tabs, type TabItem} from '@vexl-next/ui'
import React from 'react'
import {type ContactsFilter} from '../../../../../state/contacts/domain'

export default function ContactsFilterBar({
  items,
  selectedFilter,
  onSelectedFilterChange,
}: {
  readonly items: ReadonlyArray<TabItem<ContactsFilter>>
  readonly selectedFilter: ContactsFilter
  readonly onSelectedFilterChange: (filter: ContactsFilter) => void
}): React.ReactElement {
  return (
    <Stack pl="$5" mb="$4">
      <Tabs
        tabs={items}
        activeTab={selectedFilter}
        onTabPress={onSelectedFilterChange}
        size="small"
      />
    </Stack>
  )
}

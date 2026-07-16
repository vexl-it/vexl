import {FlashList} from '@shopify/flash-list'
import {Separator, Stack} from '@vexl-next/ui'
import {type Atom} from 'jotai'
import React from 'react'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import ContactItem from './ContactItem'
import ContactsListEmpty, {
  type ContactsListEmptyVariant,
} from './ContactsListEmpty'

interface Props {
  readonly contacts: ReadonlyArray<Atom<StoredContactWithComputedValues>>
  readonly keyboardBottomSpacerHeight: number
  readonly emptyVariant: ContactsListEmptyVariant
}

function renderItem({
  item,
}: {
  item: Atom<StoredContactWithComputedValues>
}): React.ReactElement {
  return <ContactItem contactAtom={item} />
}

function ItemSeparatorComponent(): React.ReactElement {
  return <Separator borderColor="$backgroundTertiary" />
}

function ContactsList({
  contacts,
  emptyVariant,
  keyboardBottomSpacerHeight,
}: Props): React.ReactElement {
  const listFooterComponent = React.useCallback(
    () => <Stack h={keyboardBottomSpacerHeight + 16} />,
    [keyboardBottomSpacerHeight]
  )
  const listEmptyComponent = React.useCallback(
    () => <ContactsListEmpty variant={emptyVariant} />,
    [emptyVariant]
  )

  return (
    <Stack f={1}>
      <FlashList
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        data={contacts}
        ItemSeparatorComponent={ItemSeparatorComponent}
        keyExtractor={atomKeyExtractor}
        renderItem={renderItem}
      />
    </Stack>
  )
}

export default ContactsList

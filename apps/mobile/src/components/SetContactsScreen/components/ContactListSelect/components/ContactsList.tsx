import {FlashList} from '@shopify/flash-list'
import {type Atom} from 'jotai'
import React from 'react'
import {Stack} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import ContactItem from './ContactItem'
import ListFooter from './ListFooter'
import ListHeader from './ListHeader'

interface Props {
  contacts: Array<Atom<StoredContactWithComputedValues>>
}

function renderItem({
  item,
}: {
  item: Atom<StoredContactWithComputedValues>
}): React.ReactElement {
  return <ContactItem contactAtom={item} />
}

function ItemSeparatorComponent(): React.ReactElement {
  return <Stack h={16} />
}

function ContactsList({contacts}: Props): React.ReactElement {
  return (
    <Stack f={1} pt="$2">
      <FlashList
        estimatedItemSize={66}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        data={contacts}
        ItemSeparatorComponent={ItemSeparatorComponent}
        keyExtractor={atomKeyExtractor}
        renderItem={renderItem}
      />
    </Stack>
  )
}

export default ContactsList

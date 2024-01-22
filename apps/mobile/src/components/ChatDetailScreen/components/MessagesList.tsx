import {FlashList} from '@shopify/flash-list'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {chatMolecule} from '../atoms'
import MessageItem, {type MessagesListItem} from './MessageItem'

function renderItem({
  item,
}: {
  item: Atom<MessagesListItem>
}): JSX.Element | null {
  return <MessageItem itemAtom={item} />
}

function MessagesList(): JSX.Element {
  const {messagesListAtomAtoms} = useMolecule(chatMolecule)
  const dataAtoms = useAtomValue(messagesListAtomAtoms)

  return (
    <FlashList
      data={dataAtoms}
      estimatedItemSize={54}
      keyExtractor={atomKeyExtractor}
      inverted
      renderItem={renderItem}
    />
  )
}

export default MessagesList

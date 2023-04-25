import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {type Atom, useAtomValue} from 'jotai'
import {type MessagesListItem} from '../utils'
import React from 'react'
import {FlashList} from '@shopify/flash-list'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import MessageItem from './MessageItem'

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

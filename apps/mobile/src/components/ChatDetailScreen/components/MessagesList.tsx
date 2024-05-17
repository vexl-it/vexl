import {FlashList} from '@shopify/flash-list'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React from 'react'
import {StyleSheet, type ViewabilityConfig} from 'react-native'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {chatMolecule} from '../atoms'
import MessageItem, {type MessagesListItem} from './MessageItem'
import {QUICK_ACTION_BANNER_HEIGHT_WITH_PADDING} from './QuickActionBanner'

const LIST_ITEM_VISIBILITY_PERCENTAGE_THRESHOLD = 30

const contentStyle = StyleSheet.create({
  contentContainerStyle: {
    paddingTop: QUICK_ACTION_BANNER_HEIGHT_WITH_PADDING,
  },
})

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: LIST_ITEM_VISIBILITY_PERCENTAGE_THRESHOLD,
}

function renderItem({
  item,
}: {
  item: Atom<MessagesListItem>
}): JSX.Element | null {
  return <MessageItem itemAtom={item} />
}

function MessagesList(): JSX.Element {
  const {
    messagesListAtomAtoms,
    handleIsRevealIdentityOrContactRevealMessageVisibleActionAtom,
  } = useMolecule(chatMolecule)
  const dataAtoms = useAtomValue(messagesListAtomAtoms)
  const handleIsRevealIdentityOrContactRevealMessageVisible = useSetAtom(
    handleIsRevealIdentityOrContactRevealMessageVisibleActionAtom
  )

  return (
    <FlashList
      data={dataAtoms}
      estimatedItemSize={54}
      contentContainerStyle={contentStyle.contentContainerStyle}
      keyExtractor={atomKeyExtractor}
      inverted
      renderItem={renderItem}
      onViewableItemsChanged={
        handleIsRevealIdentityOrContactRevealMessageVisible
      }
      viewabilityConfig={viewabilityConfig}
    />
  )
}

export default MessagesList

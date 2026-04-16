import {FlashList, type FlashListRef} from '@shopify/flash-list'
import {tokens} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useCallback, useRef} from 'react'
import {type ViewabilityConfig} from 'react-native'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {chatMolecule} from '../atoms'
import MessageItem, {type MessagesListItem} from './MessageItem'

const LIST_ITEM_VISIBILITY_PERCENTAGE_THRESHOLD = 0

const contentStyle = {
  paddingBottom: tokens.size[4].val,
} as const

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: LIST_ITEM_VISIBILITY_PERCENTAGE_THRESHOLD,
}

function renderItem({
  item,
}: {
  item: Atom<MessagesListItem>
}): React.ReactElement | null {
  return <MessageItem itemAtom={item} />
}

function MessagesList(): React.ReactElement {
  const {
    messagesListAtomAtoms,
    handleIsRevealIdentityOrContactRevealMessageVisibleActionAtom,
  } = useMolecule(chatMolecule)
  const dataAtoms = useAtomValue(messagesListAtomAtoms)
  const handleIsRevealIdentityOrContactRevealMessageVisible = useSetAtom(
    handleIsRevealIdentityOrContactRevealMessageVisibleActionAtom
  )
  const listRef = useRef<FlashListRef<Atom<MessagesListItem>>>(null)
  const viewportHeightRef = useRef(0)
  const contentHeightRef = useRef(0)
  const didInitialScrollToBottomRef = useRef(false)

  const tryInitialScrollToBottom = useCallback(() => {
    if (didInitialScrollToBottomRef.current) return
    if (viewportHeightRef.current === 0) return
    if (contentHeightRef.current <= viewportHeightRef.current) return

    didInitialScrollToBottomRef.current = true
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({animated: false})
    })
  }, [])

  return (
    <FlashList
      ref={listRef}
      data={dataAtoms}
      contentContainerStyle={contentStyle}
      keyExtractor={atomKeyExtractor}
      maintainVisibleContentPosition={{
        autoscrollToBottomThreshold: 0.2,
      }}
      onContentSizeChange={(_, height) => {
        contentHeightRef.current = height
        tryInitialScrollToBottom()
      }}
      onLayout={(event) => {
        viewportHeightRef.current = event.nativeEvent.layout.height
        tryInitialScrollToBottom()
      }}
      onLoad={tryInitialScrollToBottom}
      renderItem={renderItem}
      onViewableItemsChanged={
        handleIsRevealIdentityOrContactRevealMessageVisible
      }
      viewabilityConfig={viewabilityConfig}
    />
  )
}

export default MessagesList

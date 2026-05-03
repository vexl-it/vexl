import {FlashList, type FlashListRef} from '@shopify/flash-list'
import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {tokens} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, useStore, type Atom} from 'jotai'
import React, {useCallback, useEffect, useRef} from 'react'
import {type ViewabilityConfig} from 'react-native'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {chatMolecule} from '../atoms'
import findTargetMessageIndex, {
  type TargetMessageIndexListItem,
} from '../utils/findTargetMessageIndex'
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

function MessagesList({
  targetMessageId,
}: {
  targetMessageId?: ChatMessageId | undefined
}): React.ReactElement {
  const {
    messagesListAtomAtoms,
    handleIsRevealIdentityOrContactRevealMessageVisibleActionAtom,
  } = useMolecule(chatMolecule)
  const dataAtoms = useAtomValue(messagesListAtomAtoms)
  const store = useStore()
  const handleIsRevealIdentityOrContactRevealMessageVisible = useSetAtom(
    handleIsRevealIdentityOrContactRevealMessageVisibleActionAtom
  )
  const listRef = useRef<FlashListRef<Atom<MessagesListItem>>>(null)
  const viewportHeightRef = useRef(0)
  const contentHeightRef = useRef(0)
  const didInitialScrollToBottomRef = useRef(false)
  const scrolledToTargetMessageIdRef = useRef<ChatMessageId | undefined>(
    undefined
  )

  const getMessagesListItems = useCallback(() => {
    const items: TargetMessageIndexListItem[] = []

    for (const dataAtom of dataAtoms) {
      items.push(store.get(dataAtom))
    }

    return items
  }, [dataAtoms, store])

  const tryScrollToTargetMessage = useCallback(() => {
    if (!targetMessageId) return false
    if (scrolledToTargetMessageIdRef.current === targetMessageId) return true
    if (viewportHeightRef.current === 0) return true
    if (contentHeightRef.current === 0) return true

    const targetMessageIndex = findTargetMessageIndex({
      messagesList: getMessagesListItems(),
      targetMessageId,
    })

    if (targetMessageIndex === undefined) return false

    scrolledToTargetMessageIdRef.current = targetMessageId
    requestAnimationFrame(() => {
      void listRef.current?.scrollToIndex({
        animated: false,
        index: targetMessageIndex,
        viewPosition: 0.5,
      })
    })

    return true
  }, [getMessagesListItems, targetMessageId])

  const tryInitialScrollToBottom = useCallback(() => {
    if (tryScrollToTargetMessage()) return
    if (didInitialScrollToBottomRef.current) return
    if (viewportHeightRef.current === 0) return
    if (contentHeightRef.current <= viewportHeightRef.current) return

    didInitialScrollToBottomRef.current = true
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({animated: false})
    })
  }, [tryScrollToTargetMessage])

  useEffect(() => {
    scrolledToTargetMessageIdRef.current = undefined
    didInitialScrollToBottomRef.current = false
  }, [targetMessageId])

  useEffect(() => {
    tryInitialScrollToBottom()
  }, [dataAtoms, targetMessageId, tryInitialScrollToBottom])

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

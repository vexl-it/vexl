import {FlashList, type FlashListRef} from '@shopify/flash-list'
import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {tokens} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom, useStore, type Atom} from 'jotai'
import React, {useCallback, useEffect, useRef} from 'react'
import {type NativeScrollEvent, type ViewabilityConfig} from 'react-native'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {runAfterAnimationFrame} from '../../../utils/runAfterAnimationFrames'
import {chatMolecule} from '../atoms'
import findTargetMessageIndex, {
  type TargetMessageIndexListItem,
} from '../utils/findTargetMessageIndex'
import MessageItem, {type MessagesListItem} from './MessageItem'

const LIST_ITEM_VISIBILITY_PERCENTAGE_THRESHOLD = 0
const SCROLLED_TO_BOTTOM_THRESHOLD_PX = 48
const VIEWPORT_HEIGHT_CHANGE_THRESHOLD_PX = 1

const contentStyle = {
  paddingBottom: tokens.size[4].val,
}

const viewabilityConfig: ViewabilityConfig = {
  itemVisiblePercentThreshold: LIST_ITEM_VISIBILITY_PERCENTAGE_THRESHOLD,
}

type MessageListMessageItem = Extract<MessagesListItem, {type: 'message'}>

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
  const currentScrollOffsetRef = useRef(0)
  const viewportHeightRef = useRef(0)
  const viewportBottomAnchorRef = useRef<number | undefined>(undefined)
  const contentHeightRef = useRef(0)
  const didInitialScrollToBottomRef = useRef(false)
  const isScrolledToBottomRef = useRef(true)
  const latestMessageIdRef = useRef<ChatMessageId | undefined>(undefined)
  const scrolledToTargetMessageIdRef = useRef<ChatMessageId | undefined>(
    undefined
  )

  const updateScrollRefsToBottom = useCallback(() => {
    currentScrollOffsetRef.current = Math.max(
      contentHeightRef.current - viewportHeightRef.current,
      0
    )
    viewportBottomAnchorRef.current =
      currentScrollOffsetRef.current + viewportHeightRef.current
    isScrolledToBottomRef.current = true
  }, [])

  const isContentScrolledToBottom = useCallback((contentHeight: number) => {
    const maxOffset = Math.max(contentHeight - viewportHeightRef.current, 0)
    const distanceFromBottom = maxOffset - currentScrollOffsetRef.current

    return distanceFromBottom <= SCROLLED_TO_BOTTOM_THRESHOLD_PX
  }, [])

  const scrollToBottom = useCallback(
    (animated: boolean) => {
      runAfterAnimationFrame(() => {
        listRef.current?.scrollToEnd({animated})
        updateScrollRefsToBottom()
      })
    },
    [updateScrollRefsToBottom]
  )

  const keepScrolledToBottom = useCallback(() => {
    updateScrollRefsToBottom()
    scrollToBottom(false)
  }, [scrollToBottom, updateScrollRefsToBottom])

  const updateIsScrolledToBottom = useCallback((event: NativeScrollEvent) => {
    currentScrollOffsetRef.current = event.contentOffset.y
    viewportBottomAnchorRef.current =
      event.contentOffset.y + event.layoutMeasurement.height

    const distanceFromBottom =
      event.contentSize.height -
      event.layoutMeasurement.height -
      event.contentOffset.y

    isScrolledToBottomRef.current =
      distanceFromBottom <= SCROLLED_TO_BOTTOM_THRESHOLD_PX
  }, [])

  const scrollToViewportBottomAnchor = useCallback((anchor: number) => {
    const maxOffset = Math.max(
      contentHeightRef.current - viewportHeightRef.current,
      0
    )
    const offset = Math.min(
      Math.max(anchor - viewportHeightRef.current, 0),
      maxOffset
    )
    const distanceFromBottom = maxOffset - offset

    currentScrollOffsetRef.current = offset
    viewportBottomAnchorRef.current = offset + viewportHeightRef.current
    isScrolledToBottomRef.current =
      distanceFromBottom <= SCROLLED_TO_BOTTOM_THRESHOLD_PX
    listRef.current?.scrollToOffset({
      animated: false,
      offset,
    })
  }, [])

  const getMessagesListItems = useCallback(() => {
    const items: TargetMessageIndexListItem[] = []

    for (const dataAtom of dataAtoms) {
      items.push(store.get(dataAtom))
    }

    return items
  }, [dataAtoms, store])

  const getLatestMessageListItem = useCallback(():
    | MessageListMessageItem
    | undefined => {
    for (let index = dataAtoms.length - 1; index >= 0; index -= 1) {
      const dataAtom = dataAtoms[index]
      if (!dataAtom) continue

      const item = store.get(dataAtom)
      if (item?.type === 'message') return item
    }

    return undefined
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
    runAfterAnimationFrame(() => {
      void listRef.current?.scrollToIndex({
        animated: false,
        index: targetMessageIndex,
        viewPosition: 0.5,
      })
    })

    return true
  }, [getMessagesListItems, targetMessageId])

  const preserveBottomVisibleContentOnViewportChange = useCallback(
    (nextViewportHeight: number) => {
      const previousViewportHeight = viewportHeightRef.current
      const viewportHeightDifference =
        previousViewportHeight - nextViewportHeight
      const viewportBottomAnchor =
        currentScrollOffsetRef.current + previousViewportHeight

      viewportHeightRef.current = nextViewportHeight

      if (targetMessageId) return
      if (previousViewportHeight === 0) return
      if (
        Math.abs(viewportHeightDifference) <=
          VIEWPORT_HEIGHT_CHANGE_THRESHOLD_PX ||
        contentHeightRef.current <= nextViewportHeight
      ) {
        return
      }

      viewportBottomAnchorRef.current = viewportBottomAnchor
      scrollToViewportBottomAnchor(viewportBottomAnchor)
    },
    [scrollToViewportBottomAnchor, targetMessageId]
  )

  const tryInitialScrollToBottom = useCallback(() => {
    if (tryScrollToTargetMessage()) return
    if (didInitialScrollToBottomRef.current) return
    if (viewportHeightRef.current === 0) return
    if (contentHeightRef.current <= viewportHeightRef.current) {
      isScrolledToBottomRef.current = true
      return
    }

    didInitialScrollToBottomRef.current = true
    scrollToBottom(false)
  }, [scrollToBottom, tryScrollToTargetMessage])

  useEffect(() => {
    scrolledToTargetMessageIdRef.current = undefined
    didInitialScrollToBottomRef.current = false
    viewportBottomAnchorRef.current = undefined
  }, [targetMessageId])

  useEffect(() => {
    tryInitialScrollToBottom()
  }, [dataAtoms, targetMessageId, tryInitialScrollToBottom])

  useEffect(() => {
    if (targetMessageId) return
    if (!didInitialScrollToBottomRef.current) return

    const latestMessage = getLatestMessageListItem()
    if (!latestMessage) return

    const latestMessageId = latestMessage.message.message.uuid
    if (latestMessageIdRef.current === latestMessageId) return

    const shouldScrollToBottom =
      latestMessageIdRef.current === undefined ||
      latestMessage.message.state !== 'received' ||
      isScrolledToBottomRef.current

    latestMessageIdRef.current = latestMessageId

    if (shouldScrollToBottom) {
      scrollToBottom(true)
    }
  }, [dataAtoms, getLatestMessageListItem, scrollToBottom, targetMessageId])

  return (
    <FlashList
      ref={listRef}
      data={dataAtoms}
      contentContainerStyle={contentStyle}
      keyExtractor={atomKeyExtractor}
      maintainVisibleContentPosition={{
        autoscrollToBottomThreshold: targetMessageId ? undefined : 0.2,
        startRenderingFromBottom: !targetMessageId,
      }}
      onContentSizeChange={(_, height) => {
        const wasScrolledToBottom =
          viewportHeightRef.current !== 0 &&
          isContentScrolledToBottom(contentHeightRef.current)

        contentHeightRef.current = height

        if (height <= viewportHeightRef.current) {
          updateScrollRefsToBottom()
        } else if (!targetMessageId && wasScrolledToBottom) {
          keepScrolledToBottom()
        } else if (
          !targetMessageId &&
          viewportBottomAnchorRef.current !== undefined
        ) {
          scrollToViewportBottomAnchor(viewportBottomAnchorRef.current)
        }
        tryInitialScrollToBottom()
      }}
      onLayout={(event) => {
        preserveBottomVisibleContentOnViewportChange(
          event.nativeEvent.layout.height
        )
        if (contentHeightRef.current <= event.nativeEvent.layout.height) {
          isScrolledToBottomRef.current = true
        }
        tryInitialScrollToBottom()
      }}
      onLoad={tryInitialScrollToBottom}
      onScroll={(event) => {
        updateIsScrolledToBottom(event.nativeEvent)
      }}
      renderItem={renderItem}
      scrollEventThrottle={16}
      onViewableItemsChanged={
        handleIsRevealIdentityOrContactRevealMessageVisible
      }
      viewabilityConfig={viewabilityConfig}
    />
  )
}

export default MessagesList

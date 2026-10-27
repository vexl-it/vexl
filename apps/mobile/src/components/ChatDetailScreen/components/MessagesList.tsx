import {FlashList, type FlashListRef} from '@shopify/flash-list'
import {type ChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {useScreenFooterHeight} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useStore, type Atom} from 'jotai'
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import {useWindowDimensions, type ScrollViewProps} from 'react-native'
import {
  KeyboardChatScrollView,
  KeyboardGestureArea,
} from 'react-native-keyboard-controller'
import {useSharedValue} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {createIsOtherSideTypingAtom} from '../../../state/chat/atoms/typingIndication'
import atomKeyExtractor from '../../../utils/atomUtils/atomKeyExtractor'
import {runAfterAnimationFrame} from '../../../utils/runAfterAnimationFrames'
import {chatMolecule} from '../atoms'
import findTargetMessageIndex from '../utils/findTargetMessageIndex'
import MessageItem, {type MessagesListItem} from './MessageItem'

export const CHAT_INPUT_NATIVE_ID = 'chat-detail-input'

const maintainVisibleContentPosition = {startRenderingFromBottom: true}

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
  const {messagesListAtomAtoms, chatIdAtom} = useMolecule(chatMolecule)
  const dataAtoms = useAtomValue(messagesListAtomAtoms)
  const chatId = useAtomValue(chatIdAtom)
  const isOtherSideTyping = useAtomValue(
    useMemo(() => createIsOtherSideTypingAtom(chatId), [chatId])
  )
  const store = useStore()
  const insets = useSafeAreaInsets()
  const {height: windowHeight} = useWindowDimensions()
  const {footerHeightAtom} = useScreenFooterHeight()
  const footerHeight = useAtomValue(footerHeightAtom)
  const footerHeightSharedValue = useSharedValue(0)
  const listRef = useRef<FlashListRef<Atom<MessagesListItem>>>(null)
  const isEndVisibleRef = useRef(true)
  const shouldScrollToEndRef = useRef(false)

  useEffect(() => {
    footerHeightSharedValue.value = footerHeight
  }, [footerHeight, footerHeightSharedValue])

  const latestMessage = pipe(
    dataAtoms,
    Array.findLast((itemAtom) => store.get(itemAtom).type === 'message'),
    Option.map((itemAtom) => store.get(itemAtom)),
    Option.getOrUndefined
  )
  const latestMessageKey = latestMessage?.key
  const isLatestMessageMine =
    latestMessage?.type === 'message' &&
    latestMessage.message.state !== 'received'
  const previousLatestMessageKeyRef = useRef(latestMessageKey)

  // Layout effects run before native layout reports the new content size,
  // so the decision is made while isEndVisibleRef still describes the old content.
  useLayoutEffect(() => {
    if (previousLatestMessageKeyRef.current === latestMessageKey) return
    previousLatestMessageKeyRef.current = latestMessageKey
    shouldScrollToEndRef.current =
      isLatestMessageMine || isEndVisibleRef.current
  }, [isLatestMessageMine, latestMessageKey])

  useLayoutEffect(() => {
    if (isOtherSideTyping && isEndVisibleRef.current) {
      shouldScrollToEndRef.current = true
    }
  }, [isOtherSideTyping])

  // FlashList's own scrollToEnd ignores the keyboard/footer contentInset
  // added by KeyboardChatScrollView, so scroll the native view instead.
  const scrollToEndIfPending = useCallback(() => {
    if (!shouldScrollToEndRef.current) return
    shouldScrollToEndRef.current = false
    listRef.current?.getNativeScrollRef()?.scrollToEnd({animated: true})
  }, [])

  const onEndVisible = useCallback((visible: boolean) => {
    isEndVisibleRef.current = visible
  }, [])

  const getItemType = useCallback(
    (itemAtom: Atom<MessagesListItem>): string => {
      const item = store.get(itemAtom)
      return item.type === 'message'
        ? `message-${item.message.message.messageType}`
        : item.type
    },
    [store]
  )

  const onLoad = useCallback(() => {
    if (!targetMessageId) return
    const targetMessageIndex = findTargetMessageIndex({
      messagesList: Array.map(dataAtoms, (itemAtom) => store.get(itemAtom)),
      targetMessageId,
    })
    if (targetMessageIndex === undefined) return

    runAfterAnimationFrame(() => {
      void listRef.current?.scrollToIndex({
        animated: false,
        index: targetMessageIndex,
        viewPosition: 0.5,
      })
    })
  }, [dataAtoms, store, targetMessageId])

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <KeyboardChatScrollView
        {...props}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        offset={insets.bottom}
        extraContentPadding={footerHeightSharedValue}
        onEndVisible={onEndVisible}
        onContentSizeChange={(width, height) => {
          props.onContentSizeChange?.(width, height)
          scrollToEndIfPending()
        }}
      />
    ),
    [footerHeightSharedValue, insets.bottom, onEndVisible, scrollToEndIfPending]
  )

  return (
    <KeyboardGestureArea
      interpolator="ios"
      offset={footerHeight}
      style={{flex: 1}}
      textInputNativeID={CHAT_INPUT_NATIVE_ID}
    >
      <FlashList
        ref={listRef}
        data={dataAtoms}
        drawDistance={windowHeight}
        getItemType={getItemType}
        keyExtractor={atomKeyExtractor}
        maintainVisibleContentPosition={maintainVisibleContentPosition}
        onLoad={onLoad}
        renderItem={renderItem}
        renderScrollComponent={renderScrollComponent}
      />
    </KeyboardGestureArea>
  )
}

export default MessagesList

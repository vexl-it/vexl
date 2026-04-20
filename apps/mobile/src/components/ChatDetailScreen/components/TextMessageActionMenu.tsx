import {BlurView} from '@react-native-community/blur'
import {Copy, Reply, Stack, tokens, Typography, useTheme} from '@vexl-next/ui'
import React from 'react'
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

const messageOverlayPadding = tokens.space[5].val
const messageOverlayGap = tokens.space[5].val
const messageOverlayBottomSpace = tokens.space[6].val
const messageOverlayMenuWidth = tokens.size[13].val * 2
const messageOverlayMenuItemHeight = tokens.size[9].val
const messageOverlayMenuPadding = tokens.space[2].val
const messageOverlayMoveAnimationDuration = 180
const messageOverlayFadeAnimationDuration = 140

const style = StyleSheet.create({
  overlayTint: StyleSheet.absoluteFill,
  blur: StyleSheet.absoluteFill,
})

export interface MessageBubbleLayout {
  x: number
  y: number
  width: number
  height: number
}

interface OverlayLayout {
  bubbleLeft: number
  bubbleTop: number
  menuLeft: number
  menuTop: number
}

function getMessageOverlayLayout({
  bubbleLayout,
  insetBottom,
  insetTop,
  isMine,
  windowHeight,
  windowWidth,
}: {
  bubbleLayout: MessageBubbleLayout
  insetBottom: number
  insetTop: number
  isMine: boolean
  windowHeight: number
  windowWidth: number
}): OverlayLayout {
  const menuHeight =
    messageOverlayMenuPadding * 2 + messageOverlayMenuItemHeight * 2
  const maxBubbleLeft = windowWidth - messageOverlayPadding - bubbleLayout.width
  const bubbleLeft = Math.min(
    Math.max(bubbleLayout.x, messageOverlayPadding),
    maxBubbleLeft
  )
  const maxBubbleTop =
    windowHeight -
    insetBottom -
    insetTop -
    messageOverlayBottomSpace -
    messageOverlayPadding -
    menuHeight -
    messageOverlayGap -
    bubbleLayout.height
  const bubbleTop = Math.max(
    messageOverlayPadding,
    Math.min(bubbleLayout.y, maxBubbleTop)
  )
  const preferredMenuLeft = isMine
    ? bubbleLeft + bubbleLayout.width - messageOverlayMenuWidth
    : bubbleLeft
  const maxMenuLeft =
    windowWidth - messageOverlayPadding - messageOverlayMenuWidth
  const menuLeft = Math.min(
    Math.max(preferredMenuLeft, messageOverlayPadding),
    maxMenuLeft
  )

  return {
    bubbleLeft,
    bubbleTop,
    menuLeft,
    menuTop: bubbleTop + bubbleLayout.height + messageOverlayGap,
  }
}

function MessageActionItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress: () => void
}): React.ReactElement {
  return (
    <Stack
      role="button"
      height={messageOverlayMenuItemHeight}
      flexDirection="row"
      alignItems="center"
      gap="$3"
      paddingHorizontal="$5"
      onPress={onPress}
      pressStyle={{opacity: 0.7}}
    >
      {icon}
      <Typography color="$foregroundPrimary" variant="description">
        {label}
      </Typography>
    </Stack>
  )
}

function TextMessageActionMenu({
  bubble,
  bubbleLayout,
  copyLabel,
  isClosing,
  isMine,
  onClose,
  onCloseComplete,
  onCopy,
  onReply,
  replyLabel,
}: {
  bubble: React.ReactNode
  bubbleLayout: MessageBubbleLayout | null
  copyLabel: string
  isClosing: boolean
  isMine: boolean
  onClose: () => void
  onCloseComplete: () => void
  onCopy: () => void
  onReply: () => void
  replyLabel: string
}): React.ReactElement | null {
  const theme = useTheme()
  const {height: windowHeight, width: windowWidth} = useWindowDimensions()
  const {bottom: insetBottom, top: insetTop} = useSafeAreaInsets()
  const bubbleTranslateX = React.useRef(new Animated.Value(0)).current
  const bubbleTranslateY = React.useRef(new Animated.Value(0)).current
  const menuOpacity = React.useRef(new Animated.Value(1)).current
  const overlayOpacity = React.useRef(new Animated.Value(1)).current

  const overlayLayout =
    bubbleLayout === null
      ? null
      : getMessageOverlayLayout({
          bubbleLayout,
          insetBottom,
          insetTop,
          isMine,
          windowHeight,
          windowWidth,
        })

  React.useEffect(() => {
    if (bubbleLayout === null || overlayLayout === null || isClosing) return

    const initialTranslateX = bubbleLayout.x - overlayLayout.bubbleLeft
    const initialTranslateY = bubbleLayout.y - overlayLayout.bubbleTop

    bubbleTranslateX.stopAnimation()
    bubbleTranslateY.stopAnimation()
    menuOpacity.stopAnimation()
    overlayOpacity.stopAnimation()
    bubbleTranslateX.setValue(initialTranslateX)
    bubbleTranslateY.setValue(initialTranslateY)
    menuOpacity.setValue(1)
    overlayOpacity.setValue(1)

    if (initialTranslateX === 0 && initialTranslateY === 0) return

    Animated.parallel([
      Animated.timing(bubbleTranslateX, {
        toValue: 0,
        duration: messageOverlayMoveAnimationDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bubbleTranslateY, {
        toValue: 0,
        duration: messageOverlayMoveAnimationDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [
    bubbleLayout,
    bubbleLayout?.x,
    bubbleLayout?.y,
    bubbleTranslateX,
    bubbleTranslateY,
    isClosing,
    menuOpacity,
    overlayLayout,
    overlayOpacity,
  ])

  React.useEffect(() => {
    if (!isClosing || bubbleLayout === null || overlayLayout === null) return

    const initialTranslateX = bubbleLayout.x - overlayLayout.bubbleLeft
    const initialTranslateY = bubbleLayout.y - overlayLayout.bubbleTop

    bubbleTranslateX.stopAnimation()
    bubbleTranslateY.stopAnimation()
    menuOpacity.stopAnimation()
    overlayOpacity.stopAnimation()

    Animated.parallel([
      Animated.timing(bubbleTranslateX, {
        toValue: initialTranslateX,
        duration: messageOverlayMoveAnimationDuration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bubbleTranslateY, {
        toValue: initialTranslateY,
        duration: messageOverlayMoveAnimationDuration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(menuOpacity, {
        toValue: 0,
        duration: messageOverlayFadeAnimationDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: messageOverlayFadeAnimationDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished) onCloseComplete()
    })
  }, [
    bubbleLayout,
    bubbleTranslateX,
    bubbleTranslateY,
    isClosing,
    menuOpacity,
    onCloseComplete,
    overlayLayout,
    overlayOpacity,
  ])

  if (bubbleLayout === null || overlayLayout === null) return null

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={true}
    >
      <Stack flex={1}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[StyleSheet.absoluteFill, {opacity: overlayOpacity}]}
          >
            <BlurView
              style={style.blur}
              blurType="light"
              blurAmount={12}
              reducedTransparencyFallbackColor={theme.backgroundPrimary.val}
            />
            <View
              style={[
                style.overlayTint,
                {
                  backgroundColor: theme.backgroundPrimary.val,
                  opacity: 0.16,
                },
              ]}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: overlayLayout.bubbleTop + insetTop,
            left: overlayLayout.bubbleLeft,
            width: bubbleLayout.width + 1,
            transform: [
              {translateX: bubbleTranslateX},
              {translateY: bubbleTranslateY},
            ],
          }}
        >
          {bubble}
        </Animated.View>
        <Animated.View
          style={{
            position: 'absolute',
            top: overlayLayout.menuTop + insetTop,
            left: overlayLayout.menuLeft,
            width: messageOverlayMenuWidth,
            opacity: menuOpacity,
          }}
        >
          <Stack
            py={messageOverlayMenuPadding}
            borderRadius="$6"
            backgroundColor="$backgroundOnBar"
          >
            <MessageActionItem
              icon={<Reply color={theme.foregroundPrimary.val} size={20} />}
              label={replyLabel}
              onPress={onReply}
            />
            <MessageActionItem
              icon={<Copy color={theme.foregroundPrimary.val} size={20} />}
              label={copyLabel}
              onPress={onCopy}
            />
          </Stack>
        </Animated.View>
      </Stack>
    </Modal>
  )
}

export default TextMessageActionMenu

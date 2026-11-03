import React, {useId, useState} from 'react'
import {useWindowDimensions, type LayoutChangeEvent} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import Svg, {G, Mask, Rect} from 'react-native-svg'
import {getTokens, useTheme} from 'tamagui'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import {Stack, YStack} from '../primitives'
import {Button} from './Button'
import {NavButton} from './NavButton'
import {Typography} from './Typography'

const TITLE_HEIGHT = 96
const MIN_SCAN_WINDOW_SIZE = 120
const SCAN_WINDOW_HEIGHT_RATIO = 0.4
const SCAN_WINDOW_PREFERRED_TOP_RATIO = 0.3
const SCAN_WINDOW_STROKE_WIDTH = 4
const DIMMED_AREA_OPACITY = 0.82

interface QrScannerLayoutParams {
  readonly width: number
  readonly height: number
  readonly safeAreaTop: number
  readonly safeAreaBottom: number
  readonly bottomControlsHeight: number
}

export interface QrScannerLayout {
  readonly titleTop: number
  readonly titleHeight: number
  readonly scanWindow: {
    readonly size: number
    readonly x: number
    readonly y: number
  }
}

export function getQrScannerLayout({
  width,
  height,
  safeAreaTop,
  safeAreaBottom,
  bottomControlsHeight,
}: QrScannerLayoutParams): QrScannerLayout {
  const {space} = getTokens()
  const titleTop = safeAreaTop + space.$12.val
  const minimumScanWindowTop = titleTop + TITLE_HEIGHT + space.$6.val
  const bottomControlsTop = height - safeAreaBottom - bottomControlsHeight
  const availableScanHeight = Math.max(
    0,
    bottomControlsTop - minimumScanWindowTop
  )

  const size = Math.max(
    MIN_SCAN_WINDOW_SIZE,
    Math.min(
      width - 2 * space.$7.val,
      height * SCAN_WINDOW_HEIGHT_RATIO,
      availableScanHeight
    )
  )
  const maximumScanWindowTop = bottomControlsTop - size
  const scanWindowTop = Math.max(
    minimumScanWindowTop,
    Math.min(height * SCAN_WINDOW_PREFERRED_TOP_RATIO, maximumScanWindowTop)
  )

  return {
    titleTop,
    titleHeight: TITLE_HEIGHT,
    scanWindow: {size, x: (width - size) / 2, y: scanWindowTop},
  }
}

export interface QrScannerOverlayProps {
  readonly title: string
  readonly closeLabel: string
  readonly onClose: () => void
  readonly footer?: React.ReactNode
  readonly children: React.ReactNode
}

export function QrScannerOverlay({
  title,
  closeLabel,
  onClose,
  footer,
  children,
}: QrScannerOverlayProps): React.JSX.Element {
  const theme = useTheme()
  const maskId = useId()
  const {top, bottom} = useSafeAreaInsets()
  const {width, height} = useWindowDimensions()
  const {color, radius, space} = getTokens()
  const [footerHeight, setFooterHeight] = useState(space.$13.val)

  const {scanWindow, titleTop, titleHeight} = getQrScannerLayout({
    width,
    height,
    safeAreaTop: top,
    safeAreaBottom: bottom,
    bottomControlsHeight: footerHeight + space.$4.val,
  })
  const scanWindowTransform = `translate(${scanWindow.x} ${scanWindow.y})`

  return (
    <Stack flex={1} backgroundColor="$black100">
      {children}

      <Svg
        pointerEvents="none"
        width={width}
        height={height}
        fill="none"
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <Mask id={maskId}>
          <Rect width={width} height={height} fill={color.white100.val} />
          <G transform={scanWindowTransform}>
            <Rect
              width={scanWindow.size}
              height={scanWindow.size}
              rx={radius.$9.val}
              fill={color.black100.val}
            />
          </G>
        </Mask>
        <Rect
          width={width}
          height={height}
          fill={color.black100.val}
          fillOpacity={DIMMED_AREA_OPACITY}
          mask={`url(#${maskId})`}
        />
        <G transform={scanWindowTransform}>
          <Rect
            width={scanWindow.size}
            height={scanWindow.size}
            rx={radius.$9.val}
            stroke={theme.accentYellowPrimary.get()}
            strokeWidth={SCAN_WINDOW_STROKE_WIDTH}
            fill="none"
          />
        </G>
      </Svg>

      <Stack position="absolute" top={top} right="$5">
        <NavButton
          variant="normal"
          icon={XmarkCancelClose}
          aria-label={closeLabel}
          onPress={onClose}
        />
      </Stack>

      <YStack
        position="absolute"
        top={titleTop}
        left="$7"
        right="$7"
        height={titleHeight}
        justifyContent="flex-end"
        pointerEvents="none"
      >
        <Typography
          variant="heading3"
          color="$white100"
          textAlign="center"
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {title}
        </Typography>
      </YStack>

      {footer != null ? (
        <YStack
          position="absolute"
          left={0}
          right={0}
          bottom={bottom + space.$4.val}
          paddingHorizontal="$5"
          gap="$3"
          onLayout={(event: LayoutChangeEvent) => {
            setFooterHeight(event.nativeEvent.layout.height)
          }}
        >
          {footer}
        </YStack>
      ) : null}
    </Stack>
  )
}

export interface CameraPermissionPromptProps {
  readonly message: string
  readonly buttonLabel: string
  readonly onPress: () => void
}

export function CameraPermissionPrompt({
  message,
  buttonLabel,
  onPress,
}: CameraPermissionPromptProps): React.JSX.Element {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap="$4"
      paddingHorizontal="$4"
    >
      <Typography
        variant="paragraph"
        color="$white100"
        textAlign="center"
        maxWidth="80%"
      >
        {message}
      </Typography>
      <Button size="medium" variant="primary" onPress={onPress}>
        {buttonLabel}
      </Button>
    </YStack>
  )
}

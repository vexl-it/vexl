import React from 'react'
import {type LayoutChangeEvent} from 'react-native'
import {KeyboardStickyView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, YStack} from '../primitives'

export interface MapOverlayLayoutProps {
  readonly top?: React.ReactNode
  readonly middle?: React.ReactNode
  /** Distance of the middle slot from the top; defaults to 3/5 of the height. */
  readonly middleOffset?: number
  readonly bottom?: React.ReactNode
  /** Paints the safe-area insets with the background instead of leaving the map visible there. */
  readonly fillSafeArea?: boolean
  readonly onTopLayout?: (event: LayoutChangeEvent) => void
  readonly onBottomLayout?: (event: LayoutChangeEvent) => void
}

export function MapOverlayLayout({
  top,
  middle,
  middleOffset,
  bottom,
  fillSafeArea = true,
  onTopLayout,
  onBottomLayout,
}: MapOverlayLayoutProps): React.JSX.Element {
  const insets = useSafeAreaInsets()

  return (
    <>
      {middle != null ? (
        <YStack
          pointerEvents="none"
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
        >
          {middleOffset == null ? (
            <Stack flex={3} />
          ) : (
            <Stack height={middleOffset} />
          )}
          <Stack flex={middleOffset == null ? 2 : undefined} padding="$2">
            {middle}
          </Stack>
        </YStack>
      ) : null}
      <YStack
        pointerEvents="box-none"
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        paddingLeft={insets.left}
        paddingRight={insets.right}
        paddingTop={fillSafeArea ? 0 : insets.top}
        paddingBottom={fillSafeArea ? 0 : insets.bottom}
      >
        {fillSafeArea ? (
          <Stack height={insets.top} backgroundColor="$backgroundPrimary" />
        ) : null}
        <Stack onLayout={onTopLayout}>{top}</Stack>
        <Stack pointerEvents="none" flex={1} />
        <KeyboardStickyView pointerEvents="box-none">
          <Stack onLayout={onBottomLayout}>{bottom}</Stack>
          {fillSafeArea ? (
            <Stack
              height={insets.bottom}
              backgroundColor="$backgroundPrimary"
            />
          ) : null}
        </KeyboardStickyView>
      </YStack>
    </>
  )
}

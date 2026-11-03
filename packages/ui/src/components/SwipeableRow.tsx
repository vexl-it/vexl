import React, {useRef} from 'react'
import {Pressable} from 'react-native-gesture-handler'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import {getTokens, useTheme, type ColorTokens} from 'tamagui'

import type {IconProps} from '../icons/types'
import {Stack, YStack} from '../primitives'
import {Typography} from './Typography'

export const SWIPE_ACTION_WIDTH = 88

export type SwipeActionVariant =
  | 'destructive'
  | 'success'
  | 'accent'
  | 'neutral'

const VARIANT_BACKGROUNDS: Record<SwipeActionVariant, ColorTokens> = {
  destructive: '$redBackground',
  success: '$greenBackground',
  accent: '$accentYellowSecondary',
  neutral: '$backgroundTertiary',
}

export interface SwipeActionProps {
  readonly icon: React.ComponentType<IconProps>
  readonly label: string
  readonly variant: SwipeActionVariant
  readonly rounded?: boolean
  readonly onPress: () => void
}

export function SwipeAction({
  icon: Icon,
  label,
  variant,
  rounded = false,
  onPress,
}: SwipeActionProps): React.JSX.Element {
  const theme = useTheme()
  const accent = variant === 'accent'

  return (
    <Pressable style={{flex: 1}} onPress={onPress}>
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$1"
        borderRadius={rounded ? '$5' : '$0'}
        backgroundColor={VARIANT_BACKGROUNDS[variant]}
      >
        <Icon
          size={24}
          color={
            accent
              ? theme.accentHighlightPrimary.get()
              : theme.foregroundPrimary.get()
          }
        />
        <Typography
          variant="descriptionBold"
          alignSelf="center"
          width={SWIPE_ACTION_WIDTH}
          textAlign="center"
          color={accent ? '$accentHighlightPrimary' : '$foregroundPrimary'}
        >
          {label}
        </Typography>
      </YStack>
    </Pressable>
  )
}

export type SwipeSide = 'left' | 'right'

// The revealed area grows with the drag; the action stretches to fill it and is
// clipped to it, so it is never painted underneath the closing row.
export function SwipeActionPanel({
  side,
  gap,
  translation,
  ...action
}: SwipeActionProps & {
  readonly side: SwipeSide
  readonly gap: number
  readonly translation: SharedValue<number>
}): React.JSX.Element {
  const clipStyle = useAnimatedStyle(() => ({
    width: Math.max(0, Math.abs(translation.get()) - gap),
  }))
  const panelStyle = useAnimatedStyle(() => ({
    width: Math.max(SWIPE_ACTION_WIDTH, Math.abs(translation.get()) - gap),
  }))
  const anchor = side === 'left' ? {left: 0} : {right: 0}

  return (
    <Stack width={SWIPE_ACTION_WIDTH + gap}>
      <Animated.View
        style={[
          {position: 'absolute', top: 0, bottom: 0, overflow: 'hidden'},
          anchor,
          clipStyle,
        ]}
      >
        <Animated.View
          style={[
            {position: 'absolute', top: 0, bottom: 0},
            anchor,
            panelStyle,
          ]}
        >
          <SwipeAction {...action} />
        </Animated.View>
      </Animated.View>
    </Stack>
  )
}

export type SwipeableRowAction = Omit<SwipeActionProps, 'rounded'>

export interface SwipeableRowProps {
  readonly leftAction?: SwipeableRowAction
  readonly rightAction?: SwipeableRowAction
  /** Rounded actions separated from the row by a gap, for card rows. */
  readonly rounded?: boolean
  readonly children: React.ReactNode
}

export function SwipeableRow({
  leftAction,
  rightAction,
  rounded = false,
  children,
}: SwipeableRowProps): React.JSX.Element {
  const swipeableRef = useRef<SwipeableMethods>(null)
  const gap = rounded ? getTokens().space.$5.val : 0

  const renderActions = (
    side: SwipeSide,
    action: SwipeableRowAction | undefined
  ): React.ComponentProps<typeof Swipeable>['renderLeftActions'] =>
    action &&
    ((_, translation) => (
      <SwipeActionPanel
        {...action}
        side={side}
        gap={gap}
        rounded={rounded}
        translation={translation}
        onPress={() => {
          swipeableRef.current?.close()
          action.onPress()
        }}
      />
    ))

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderActions('left', leftAction)}
      renderRightActions={renderActions('right', rightAction)}
    >
      {children}
    </Swipeable>
  )
}

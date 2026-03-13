import {atom, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {type LayoutChangeEvent} from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, styled, useTheme} from 'tamagui'

import type {IconProps} from '../icons/types'
import {SizableText, Stack, XStack} from '../primitives'

export const navBarHeightAtom = atom(0)

const SCROLL_THRESHOLD = 100

export interface AnimatedNavigationBarAction {
  readonly icon: React.ComponentType<IconProps>
  readonly onPress: () => void
}

export interface AnimatedNavigationBarProps {
  readonly title?: string
  readonly rightActions?: readonly AnimatedNavigationBarAction[]
  readonly scrollY: SharedValue<number>
}

const Bar = styled(XStack, {
  name: 'AnimatedNavigationBarBar',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '$5',
  alignSelf: 'stretch',
})

const TitleArea = styled(XStack, {
  name: 'AnimatedNavigationBarTitleArea',
  flex: 1,
  alignItems: 'center',
  paddingVertical: '$1',
})

const Title = styled(SizableText, {
  name: 'AnimatedNavigationBarTitle',
  fontFamily: '$body',
  fontWeight: '600',
  fontSize: '$5',
  letterSpacing: '$5',
  color: '$foregroundPrimary',
  flex: 1,
})

const IconsArea = styled(XStack, {
  name: 'AnimatedNavigationBarIconsArea',
  alignItems: 'center',
  gap: '$5',
})

const ActionButton = styled(Stack, {
  name: 'AnimatedNavigationBarActionButton',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  width: '$8',
  height: '$8',

  pressStyle: {
    opacity: 0.7,
  },
})

function ActionIcon({
  action,
}: {
  readonly action: AnimatedNavigationBarAction
}): React.JSX.Element {
  const theme = useTheme()
  const Icon = action.icon

  return (
    <ActionButton onPress={action.onPress}>
      <Icon
        color={theme.foregroundPrimary.val}
        size={getTokens().size.$8.val}
      />
    </ActionButton>
  )
}

const baseFrameStyle = {alignSelf: 'stretch' as const}

export function AnimatedNavigationBar({
  title,
  rightActions,
  scrollY,
}: AnimatedNavigationBarProps): React.JSX.Element {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const setNavBarHeight = useSetAtom(navBarHeightAtom)

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      setNavBarHeight(e.nativeEvent.layout.height)
    },
    [setNavBarHeight]
  )

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      Math.min(scrollY.value, SCROLL_THRESHOLD),
      [0, SCROLL_THRESHOLD],
      ['transparent', theme.backgroundSecondary.val]
    )
    return {backgroundColor}
  })

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = Math.min(scrollY.value / SCROLL_THRESHOLD, 1)
    return {opacity}
  })

  return (
    <Animated.View
      style={[baseFrameStyle, {paddingTop: insets.top}, animatedStyle]}
      onLayout={handleLayout}
    >
      <Bar>
        <TitleArea>
          {title ? (
            <Animated.View style={titleAnimatedStyle}>
              <Title>{title}</Title>
            </Animated.View>
          ) : null}
        </TitleArea>
        {rightActions && rightActions.length > 0 ? (
          <IconsArea>
            {rightActions.map((action, i) => (
              <ActionIcon key={i} action={action} />
            ))}
          </IconsArea>
        ) : null}
      </Bar>
    </Animated.View>
  )
}

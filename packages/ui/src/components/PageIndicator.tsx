import {Array} from 'effect'
import React, {useEffect} from 'react'
import {Pressable} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {getTokens, useTheme} from 'tamagui'
import {XStack} from '../primitives'

function PageDot({
  active,
  label,
  onPress,
}: {
  readonly active: boolean
  readonly label: string
  readonly onPress: () => void
}): React.JSX.Element {
  const theme = useTheme()
  const size = getTokens().size.$4.val / 2
  const activeWidth = getTokens().size.$5.val
  const color = active
    ? theme.foregroundPrimary.get()
    : theme.foregroundTertiary.get()
  const width = useSharedValue(active ? activeWidth : size)
  const backgroundColor = useSharedValue(color)
  useEffect(() => {
    width.value = withTiming(active ? activeWidth : size, {duration: 200})
    backgroundColor.value = withTiming(color, {duration: 200})
  }, [active, activeWidth, backgroundColor, color, size, width])
  const style = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: backgroundColor.value,
  }))
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected: active}}
      hitSlop={{top: size * 1.5, bottom: size * 1.5}}
      onPress={onPress}
    >
      <Animated.View style={[{height: size, borderRadius: size / 2}, style]} />
    </Pressable>
  )
}

export function PageIndicator({
  pages,
  activeIndex,
  onSelect,
}: {
  readonly pages: ReadonlyArray<{key: string; label: string}>
  readonly activeIndex: number
  readonly onSelect: (index: number) => void
}): React.JSX.Element {
  return (
    <XStack jc="center" gap={getTokens().space.$4.val / 2}>
      {Array.map(pages, (page, index) => (
        <PageDot
          key={page.key}
          label={page.label}
          active={index === activeIndex}
          onPress={() => {
            onSelect(index)
          }}
        />
      ))}
    </XStack>
  )
}

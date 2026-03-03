import React, {useCallback, useEffect, useMemo, useState} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {getTokens, styled, useTheme} from 'tamagui'

import {ChevronDown} from '../icons/ChevronDown'
import type {IconProps} from '../icons/types'
import {SizableText, XStack, YStack} from '../primitives'

const ANIMATION_DURATION = 250

const PickerTriggerFrame = styled(XStack, {
  name: 'PickerTrigger',
  role: 'button',
  alignItems: 'center',
  gap: '$3',
  height: '$11',
  paddingHorizontal: '$5',
  borderRadius: '$5',
  backgroundColor: '$backgroundSecondary',

  pressStyle: {
    opacity: 0.7,
  },
})

const PickerLabel = styled(SizableText, {
  name: 'PickerLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  letterSpacing: '$4',
  color: '$accentHighlightPrimary',
  flex: 1,
})

const PickerItemFrame = styled(XStack, {
  name: 'PickerItemFrame',
  role: 'button',
  alignSelf: 'stretch',
  paddingVertical: '$2',
  paddingHorizontal: '$3',
  borderRadius: '$2.5',

  pressStyle: {
    backgroundColor: '$backgroundTertiary',
  },
})

const PickerItemLabel = styled(SizableText, {
  name: 'PickerItemLabel',
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$2',
  letterSpacing: '$2',
  color: '$foregroundPrimary',
})

export interface PickerItem<T extends string> {
  readonly label: string
  readonly value: T
  readonly icon?: React.ComponentType<IconProps>
}

export interface PickerProps<T extends string> {
  readonly items: ReadonlyArray<PickerItem<T>>
  readonly value: T
  readonly onValueChange: (value: T) => void
  readonly placeholder?: string
}

function PickerDropdown<T extends string>({
  items,
  onItemPress,
  onCloseComplete,
  closing,
}: {
  readonly items: ReadonlyArray<PickerItem<T>>
  readonly onItemPress: (value: T) => void
  readonly onCloseComplete: () => void
  readonly closing: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const spaceTokens = getTokens().space
  const topMargin = spaceTokens.$2.val

  const measuredHeight = useSharedValue(0)
  const animatedHeight = useSharedValue(0)

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height
      if (height > 0 && measuredHeight.value === 0) {
        measuredHeight.value = height
        animatedHeight.value = withTiming(height, {
          duration: ANIMATION_DURATION,
        })
      }
    },
    [animatedHeight, measuredHeight]
  )

  useEffect(() => {
    if (closing) {
      animatedHeight.value = withTiming(
        0,
        {duration: ANIMATION_DURATION},
        () => {
          scheduleOnRN(onCloseComplete)
        }
      )
    }
  }, [closing, onCloseComplete, animatedHeight])

  const clipStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden' as const,
  }))

  return (
    <Animated.View style={[{marginTop: topMargin}, clipStyle]}>
      <Animated.View
        onLayout={handleLayout}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          backgroundColor: theme.backgroundSecondary.val,
          borderRadius: 16,
          padding: 12,
          gap: 12,
        }}
      >
        {items.map((item) => (
          <PickerItemFrame
            key={item.value}
            onPress={() => {
              onItemPress(item.value)
            }}
          >
            <PickerItemLabel>{item.label}</PickerItemLabel>
          </PickerItemFrame>
        ))}
      </Animated.View>
    </Animated.View>
  )
}

export function Picker<T extends string>({
  items,
  value,
  onValueChange,
  placeholder = 'Select',
}: PickerProps<T>): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const theme = useTheme()

  const selectedItem = useMemo(
    () => items.find((item) => item.value === value),
    [items, value]
  )

  const SelectedIcon = selectedItem?.icon
  const triggerIconColor = theme.accentHighlightPrimary.val

  const toggleOpen = useCallback(() => {
    if (open) {
      setClosing(true)
    } else {
      setOpen(true)
    }
  }, [open])

  const handleCloseComplete = useCallback(() => {
    setOpen(false)
    setClosing(false)
  }, [])

  const handleItemPress = useCallback(
    (itemValue: T) => {
      onValueChange(itemValue)
      setClosing(true)
    },
    [onValueChange]
  )

  return (
    <YStack>
      <PickerTriggerFrame onPress={toggleOpen}>
        {SelectedIcon ? (
          <SelectedIcon color={triggerIconColor} size={24} />
        ) : null}
        <PickerLabel>{selectedItem?.label ?? placeholder}</PickerLabel>
        <ChevronDown color={triggerIconColor} size={24} />
      </PickerTriggerFrame>

      {open ? (
        <PickerDropdown
          items={items}
          onItemPress={handleItemPress}
          onCloseComplete={handleCloseComplete}
          closing={closing}
        />
      ) : null}
    </YStack>
  )
}

import React, {useCallback, useEffect, useMemo, useState} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {styled, useTheme} from 'tamagui'

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

const PickerDropdownFrame = styled(YStack, {
  name: 'PickerDropdownFrame',
  marginTop: '$2',
})

const PickerDropdownContent = styled(YStack, {
  name: 'PickerDropdownContent',
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$4',
  padding: '$3',
  gap: '$3',
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
  const measuredHeight = useSharedValue(0)
  const animatedHeight = useSharedValue(0)

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const height = e.nativeEvent.layout.height
      if (height <= 0 || measuredHeight.value === height) return

      measuredHeight.value = height

      if (!closing) {
        animatedHeight.value = withTiming(height, {
          duration: ANIMATION_DURATION,
        })
      }
    },
    [animatedHeight, closing, measuredHeight]
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
    <PickerDropdownFrame>
      <Animated.View style={clipStyle}>
        <PickerDropdownContent onLayout={handleLayout}>
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
        </PickerDropdownContent>
      </Animated.View>
    </PickerDropdownFrame>
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

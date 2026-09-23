import React, {useEffect, useState} from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {styled, useTheme, type YStackProps} from 'tamagui'

import {ChevronDown} from '../icons/ChevronDown'
import {XStack, YStack} from '../primitives'
import {Typography} from './Typography'

const ROTATION_DURATION = 200

const DisclosureHeader = styled(XStack, {
  name: 'DisclosureHeader',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '$3',
  paddingVertical: '$3',

  pressStyle: {
    opacity: 0.7,
  },
})

const DisclosureBody = styled(YStack, {
  name: 'DisclosureBody',
  padding: '$4',
  borderRadius: '$4',
  backgroundColor: '$backgroundSecondary',
})

export interface DisclosureProps extends Omit<YStackProps, 'children'> {
  readonly title: string
  readonly children: React.ReactNode
  readonly defaultOpen?: boolean
}

export function Disclosure({
  title,
  children,
  defaultOpen = false,
  ...rest
}: DisclosureProps): React.JSX.Element {
  const theme = useTheme()
  const [open, setOpen] = useState(defaultOpen)
  const rotation = useSharedValue(defaultOpen ? 180 : 0)

  useEffect(() => {
    rotation.value = withTiming(open ? 180 : 0, {duration: ROTATION_DURATION})
  }, [open, rotation])

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }))

  return (
    <YStack {...rest}>
      <DisclosureHeader
        aria-expanded={open}
        onPress={() => {
          setOpen((prev) => !prev)
        }}
      >
        <Typography
          variant="paragraphSmallBold"
          color="$foregroundPrimary"
          flex={1}
        >
          {title}
        </Typography>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} color={theme.foregroundSecondary.get()} />
        </Animated.View>
      </DisclosureHeader>
      {open ? (
        <DisclosureBody>
          {typeof children === 'string' ? (
            <Typography variant="description" color="$foregroundSecondary">
              {children}
            </Typography>
          ) : (
            children
          )}
        </DisclosureBody>
      ) : null}
    </YStack>
  )
}

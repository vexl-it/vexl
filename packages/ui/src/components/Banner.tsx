import React, {useState} from 'react'
import {useWindowDimensions} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import {styled} from 'tamagui'

import {Stack, XStack, YStack} from '../primitives'
import {CardButton} from './CardButton'
import {Typography} from './Typography'

export type BannerColor = 'green' | 'pink'

export interface BannerButton {
  readonly label: string
  readonly onPress?: () => void
}

export interface BannerProps {
  readonly color?: BannerColor
  readonly title: string
  readonly description: string
  readonly image?: React.ReactNode
  readonly primaryButton?: BannerButton
  readonly secondaryButton?: BannerButton
  /** Button presses slide the banner out and call `onPress` once it is gone. */
  readonly dismissible?: boolean
}

const DISMISS_ANIMATION_DURATION_MS = 350

const BannerFrame = styled(YStack, {
  name: 'Banner',
  padding: '$4',
  borderRadius: '$5',
  gap: '$5',
  overflow: 'hidden',

  variants: {
    color: {
      green: {
        backgroundColor: '$greenBackground',
      },
      pink: {
        backgroundColor: '$pinkBackground',
      },
    },
  },

  defaultVariants: {
    color: 'green',
  },
})

const ImageFrame = styled(Stack, {
  name: 'BannerImage',
  borderRadius: '$3',
  overflow: 'hidden',
  alignSelf: 'stretch',
})

export function Banner({
  color = 'green',
  title,
  description,
  image,
  primaryButton,
  secondaryButton,
  dismissible = false,
}: BannerProps): React.JSX.Element {
  const {width} = useWindowDimensions()
  const dismissProgress = useSharedValue(0)
  const [dismissing, setDismissing] = useState(false)
  const dismissStyle = useAnimatedStyle(() => ({
    opacity: 1 - dismissProgress.value,
    transform: [{translateX: -width * dismissProgress.value}],
  }))

  const handlePress = (onPress?: () => void) => (): void => {
    if (!dismissible) {
      onPress?.()
      return
    }
    if (dismissing) return

    setDismissing(true)
    dismissProgress.value = withTiming(
      1,
      {
        duration: DISMISS_ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished && onPress) scheduleOnRN(onPress)
      }
    )
  }

  return (
    <Animated.View
      pointerEvents={dismissing ? 'none' : 'auto'}
      style={dismissStyle}
    >
      <BannerFrame color={color}>
        {image != null ? <ImageFrame>{image}</ImageFrame> : null}
        <YStack gap="$3">
          <Typography variant="tabSmallBold" color="$foregroundPrimary">
            {title}
          </Typography>
          <Typography variant="description" color="$foregroundSecondary">
            {description}
          </Typography>
          {primaryButton != null || secondaryButton != null ? (
            <XStack gap="$3">
              {primaryButton != null ? (
                <CardButton onPress={handlePress(primaryButton.onPress)}>
                  {primaryButton.label}
                </CardButton>
              ) : null}
              {secondaryButton != null ? (
                <CardButton
                  type="text"
                  onPress={handlePress(secondaryButton.onPress)}
                >
                  {secondaryButton.label}
                </CardButton>
              ) : null}
            </XStack>
          ) : null}
        </YStack>
      </BannerFrame>
    </Animated.View>
  )
}

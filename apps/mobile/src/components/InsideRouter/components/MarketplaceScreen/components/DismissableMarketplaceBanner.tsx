import {Banner, type BannerButton, type BannerProps} from '@vexl-next/ui'
import React, {useCallback, useRef, useState} from 'react'
import {Animated, Easing, useWindowDimensions} from 'react-native'

const DISMISS_ANIMATION_DURATION_MS = 350

interface Props extends Omit<BannerProps, 'primaryButton' | 'secondaryButton'> {
  readonly primaryButton?: BannerButton
  readonly secondaryButton: BannerButton
}

function DismissableMarketplaceBanner({
  primaryButton,
  secondaryButton,
  ...props
}: Props): React.ReactElement {
  const {width} = useWindowDimensions()
  const opacity = useRef(new Animated.Value(1)).current
  const translateX = useRef(new Animated.Value(0)).current
  const [isDismissing, setIsDismissing] = useState(false)

  const dismissWithAnimation = useCallback(
    (onDismiss?: () => void) => {
      if (isDismissing) return

      setIsDismissing(true)
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -width,
          duration: DISMISS_ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: DISMISS_ANIMATION_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({finished}) => {
        if (finished && onDismiss != null) {
          onDismiss()
        }
      })
    },
    [isDismissing, opacity, translateX, width]
  )

  const dismissWithPrimaryAction = useCallback(() => {
    dismissWithAnimation(primaryButton?.onPress)
  }, [dismissWithAnimation, primaryButton?.onPress])

  const dismissWithSecondaryAction = useCallback(() => {
    dismissWithAnimation(secondaryButton.onPress)
  }, [dismissWithAnimation, secondaryButton.onPress])

  return (
    <Animated.View
      pointerEvents={isDismissing ? 'none' : 'auto'}
      style={{opacity, transform: [{translateX}]}}
    >
      <Banner
        {...props}
        primaryButton={
          primaryButton != null
            ? {
                ...primaryButton,
                onPress: dismissWithPrimaryAction,
              }
            : undefined
        }
        secondaryButton={{
          ...secondaryButton,
          onPress: dismissWithSecondaryAction,
        }}
      />
    </Animated.View>
  )
}

export default DismissableMarketplaceBanner

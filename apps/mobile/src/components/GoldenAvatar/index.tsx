import {
  avatarsGoldenGlassesAndBackgroundSvg,
  Button,
  IconButton,
  Stack,
  Typography,
  useTheme,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {Platform, useWindowDimensions, Vibration} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {
  AvatarBackground,
  AvatarGlasses,
  AvatarShapeFour,
  AvatarShapeOne,
  AvatarShapeThree,
  AvatarShapeTwo,
  ShimmerStar,
} from './components/GoldenAvatarAnimationAssets'

export const showGoldenAvatarAnimationAtom = atom(false)

export const forceHideGoldenAvatarAnimationActionAtom = atom(null, (_, set) => {
  set(showGoldenAvatarAnimationAtom, false)
})

function GoldenAvatar(): React.ReactElement | null {
  const {t} = useTranslation()
  const {height, width} = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const GoldenAvatarAsset = avatarsGoldenGlassesAndBackgroundSvg[0]
  const avatarShapeOneColor = theme.greenBackground.get()
  const avatarShapeTwoColor = theme.accentYellowPrimary.get()
  const avatarShapeThreeColor = theme.backgroundHighlight.get()
  const avatarShapeFourColor = theme.pinkForeground.get()
  const avatarLensColor = theme.backgroundTertiary.get()

  const showGoldenAvatarAnimation = useAtomValue(showGoldenAvatarAnimationAtom)
  const forceHideGoldenAvatarAnimation = useSetAtom(
    forceHideGoldenAvatarAnimationActionAtom
  )

  const regularAvatarRotation = useSharedValue(0)
  const goldenAvatarRotation = useSharedValue(0)
  const sharedOpacity = useSharedValue(0)
  const shapeOneTranslateY = useSharedValue(-height)
  const shapeTwoTranslateX = useSharedValue(-width)
  const shapeThreeTranslateY = useSharedValue(height)
  const shapeFourTranslateX = useSharedValue(width)
  const glassesTranslateY = useSharedValue(-height)
  const avatarBackgroundOpacity = useSharedValue(0)
  const descriptionOpacity = useSharedValue(0)
  const sharedStarScale = useSharedValue(0)
  const continueButtonOpacity = useSharedValue(0)

  const regularAvatarRotationAnimation = useAnimatedStyle(() => {
    const rotation = interpolate(regularAvatarRotation.value, [0, 1], [0, 90])
    return {
      opacity: 1 - regularAvatarRotation.value,
      transform: [{rotateY: `${rotation}deg`}],
    }
  })
  const goldenAvatarRotationAnimation = useAnimatedStyle(() => {
    const rotation = interpolate(goldenAvatarRotation.value, [0, 1], [270, 360])
    return {
      opacity: goldenAvatarRotation.value,
      transform: [{rotateY: `${rotation}deg`}],
    }
  })
  const backgroundOpacityAnimation = useAnimatedStyle(() => ({
    opacity: sharedOpacity.value,
  }))
  const shapeOneTranslateAnimation = useAnimatedStyle(() => ({
    transform: [{translateY: shapeOneTranslateY.value}],
  }))
  const shapeTwoTranslateAnimation = useAnimatedStyle(() => ({
    transform: [{translateX: shapeTwoTranslateX.value}],
  }))
  const shapeThreeTranslateAnimation = useAnimatedStyle(() => ({
    transform: [{translateY: shapeThreeTranslateY.value}],
  }))
  const shapeFourTranslateAnimation = useAnimatedStyle(() => ({
    transform: [{translateX: shapeFourTranslateX.value}],
  }))
  const glassesTranslateAnimation = useAnimatedStyle(() => ({
    transform: [{translateY: glassesTranslateY.value}],
  }))
  const avatarBackgroundOpacityAnimation = useAnimatedStyle(() => ({
    opacity: avatarBackgroundOpacity.value,
  }))
  const descriptionOpacityAnimation = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
  }))
  const starScaleAnimation = useAnimatedStyle(() => ({
    transform: [{scale: sharedStarScale.value}],
  }))
  const continueButtonOpacityAnimation = useAnimatedStyle(() => ({
    opacity: continueButtonOpacity.value,
  }))

  useEffect(() => {
    setTimeout(() => {
      void impactAsync(ImpactFeedbackStyle.Heavy)
    }, 1300)
    setTimeout(() => {
      void impactAsync(ImpactFeedbackStyle.Heavy)
    }, 1400)
    setTimeout(() => {
      void impactAsync(ImpactFeedbackStyle.Medium)
    }, 1500)
    setTimeout(() => {
      void impactAsync(ImpactFeedbackStyle.Heavy)
    }, 1700)
    setTimeout(() => {
      void impactAsync(ImpactFeedbackStyle.Light)
    }, 1900)
    setTimeout(() => {
      void impactAsync(ImpactFeedbackStyle.Medium)
    }, 2000)
    setTimeout(() => {
      void impactAsync(ImpactFeedbackStyle.Light)
    }, 2200)

    setTimeout(() => {
      if (Platform.OS === 'ios') {
        Vibration.vibrate() // Default short vibration for iOS
      } else {
        Vibration.vibrate(300) // 300ms vibration for Android
      }
    }, 2800)
  }, [])

  useEffect(() => {
    if (showGoldenAvatarAnimation)
      sharedOpacity.value = withTiming(0.9, {duration: 750}, () => {
        shapeOneTranslateY.value = withTiming(0, {
          duration: 1750,
          easing: Easing.bounce,
          reduceMotion: ReduceMotion.System,
        })
        shapeTwoTranslateX.value = withTiming(0, {
          duration: 1900,
          easing: Easing.bounce,
          reduceMotion: ReduceMotion.System,
        })
        shapeThreeTranslateY.value = withTiming(0, {
          duration: 1250,
          easing: Easing.bounce,
          reduceMotion: ReduceMotion.System,
        })
        shapeFourTranslateX.value = withTiming(0, {
          duration: 1400,
          easing: Easing.bounce,
          reduceMotion: ReduceMotion.System,
        })
        glassesTranslateY.value = withTiming(
          0,
          {
            duration: 1500,
            easing: Easing.bounce,
            reduceMotion: ReduceMotion.System,
          },
          () => {
            avatarBackgroundOpacity.value = withDelay(
              100,
              withTiming(
                1,
                {
                  duration: 400,
                },
                () => {
                  regularAvatarRotation.value = withDelay(
                    300,
                    withSequence(
                      withTiming(
                        1,
                        {
                          duration: 350,
                          easing: Easing.linear,
                        },
                        () => {
                          goldenAvatarRotation.value = withTiming(
                            1,
                            {
                              duration: 500,
                              easing: Easing.linear,
                            },
                            () => {
                              sharedStarScale.value = withDelay(
                                250,
                                withTiming(0.8, {duration: 150}, () => {
                                  descriptionOpacity.value = withTiming(1, {
                                    duration: 750,
                                  })
                                  continueButtonOpacity.value = withTiming(1, {
                                    duration: 750,
                                  })
                                })
                              )
                            }
                          )
                        }
                      )
                    )
                  )
                }
              )
            )
          }
        )
      })
  }, [
    avatarBackgroundOpacity,
    continueButtonOpacity,
    descriptionOpacity,
    glassesTranslateY,
    goldenAvatarRotation,
    regularAvatarRotation,
    shapeFourTranslateX,
    shapeOneTranslateY,
    shapeThreeTranslateY,
    shapeTwoTranslateX,
    sharedOpacity,
    sharedStarScale,
    showGoldenAvatarAnimation,
  ])

  if (!showGoldenAvatarAnimation) return null

  return (
    <Stack
      pos="absolute"
      t={0}
      b={0}
      l={0}
      r={0}
      zIndex={1000}
      ai="center"
      jc="center"
    >
      <Stack
        pos="absolute"
        top={insets.top}
        right={insets.right}
        pr="$4"
        pt="$4"
        zIndex={1010}
      >
        <IconButton onPress={forceHideGoldenAvatarAnimation}>
          <XmarkCancelClose color={theme.foregroundPrimary.get()} size={24} />
        </IconButton>
      </Stack>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.black100.get(),
            zIndex: 1000,
          },
          backgroundOpacityAnimation,
        ]}
      />
      <Stack mb="$4" zIndex={1001}>
        <Animated.View style={[descriptionOpacityAnimation]}>
          <Typography variant="tabLarge" color="$white100" textAlign="center">
            {t('goldenGlasses.youReceived')}
          </Typography>
        </Animated.View>
      </Stack>
      <Stack zIndex={1001} width={150} height={150}>
        <Animated.View style={[{flex: 1}, regularAvatarRotationAnimation]}>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1002},
              shapeOneTranslateAnimation,
            ]}
          >
            <AvatarShapeOne color={avatarShapeOneColor} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1003},
              shapeTwoTranslateAnimation,
            ]}
          >
            <AvatarShapeTwo color={avatarShapeTwoColor} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1004},
              shapeThreeTranslateAnimation,
            ]}
          >
            <AvatarShapeThree color={avatarShapeThreeColor} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1005},
              shapeFourTranslateAnimation,
            ]}
          >
            <AvatarShapeFour color={avatarShapeFourColor} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1006},
              glassesTranslateAnimation,
            ]}
          >
            <AvatarGlasses lensColor={avatarLensColor} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1001},
              avatarBackgroundOpacityAnimation,
            ]}
          >
            <AvatarBackground />
          </Animated.View>
        </Animated.View>
        <Animated.View
          style={[
            {position: 'absolute', zIndex: 1011},
            goldenAvatarRotationAnimation,
          ]}
        >
          {GoldenAvatarAsset ? <GoldenAvatarAsset /> : null}
        </Animated.View>
        <Animated.View
          style={[
            {position: 'absolute', right: 20, top: 25, zIndex: 1012},
            starScaleAnimation,
          ]}
        >
          <ShimmerStar />
        </Animated.View>
      </Stack>
      <Stack mt="$4" zIndex={1001} gap="$2">
        <Animated.View
          style={[{alignSelf: 'center'}, descriptionOpacityAnimation]}
        >
          <Typography
            variant="heading3"
            color="$accentYellowPrimary"
            textAlign="center"
          >
            {t('goldenGlasses.goldenGlasses')}
          </Typography>
        </Animated.View>
        <Animated.View
          style={[{alignSelf: 'center'}, descriptionOpacityAnimation]}
        >
          <Typography variant="tabLarge" color="$white100" textAlign="center">
            {t('goldenGlasses.forJoiningMeetup')}
          </Typography>
        </Animated.View>
      </Stack>
      <Stack
        pos="absolute"
        zi={1010}
        px="$4"
        pb="$4"
        l={insets.left}
        r={insets.right}
        b={insets.bottom}
      >
        <Animated.View style={continueButtonOpacityAnimation}>
          <Button variant="secondary" onPress={forceHideGoldenAvatarAnimation}>
            {t('common.continue')}
          </Button>
        </Animated.View>
      </Stack>
    </Stack>
  )
}

export default GoldenAvatar

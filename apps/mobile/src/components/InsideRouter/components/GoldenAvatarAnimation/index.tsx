import {atom, useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {useWindowDimensions} from 'react-native'
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
import {getTokens, Stack, Text} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import Button from '../../../Button'
import IconButton from '../../../IconButton'
import Image from '../../../Image'
import closeSvg from '../../../images/closeSvg'
import avatarBackgroundSvg from './images/avatarBackgroundSvg'
import avatarGlassesSvg from './images/avatarGlassesSvg'
import avatarSvg1 from './images/avatarSvg1'
import avatarSvg2 from './images/avatarSvg2'
import avatarSvg3 from './images/avatarSvg3'
import avatarSvg4 from './images/avatarSvg4'
import goldenAvatarSvg from './images/goldenAvatarSvg'
import shimerStarSvg from './images/shimerStarSvg'

export const showGoldenAvatarAnimationAtom = atom(false)

export const forceHideGoldenAvatarAnimationActionAtom = atom(null, (_, set) => {
  set(showGoldenAvatarAnimationAtom, false)
})

function GoldenAvatarAnimation(): JSX.Element | null {
  const {t} = useTranslation()
  const {height, width} = useWindowDimensions()
  const insets = useSafeAreaInsets()

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
    if (showGoldenAvatarAnimation)
      sharedOpacity.value = withTiming(0.8, {duration: 1500}, () => {
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
              200,
              withTiming(
                1,
                {
                  duration: 800,
                },
                () => {
                  regularAvatarRotation.value = withDelay(
                    300,
                    withSequence(
                      withTiming(
                        1,
                        {
                          duration: 700,
                          easing: Easing.linear,
                        },
                        () => {
                          goldenAvatarRotation.value = withTiming(
                            1,
                            {
                              duration: 700,
                              easing: Easing.linear,
                            },
                            () => {
                              sharedStarScale.value = withDelay(
                                500,
                                withTiming(0.8, {duration: 300}, () => {
                                  descriptionOpacity.value = withTiming(1, {
                                    duration: 1500,
                                  })
                                  continueButtonOpacity.value = withTiming(1, {
                                    duration: 1500,
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
        <IconButton icon={closeSvg} onPress={forceHideGoldenAvatarAnimation} />
      </Stack>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: getTokens().color.black.val,
            zIndex: 1000,
          },
          backgroundOpacityAnimation,
        ]}
      />
      <Stack mb="$4" zIndex={1001}>
        <Animated.View style={[descriptionOpacityAnimation]}>
          <Text textAlign="center" fontFamily="$body600" fos={14} col="$white">
            {t('goldenGlasses.youReceived')}
          </Text>
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
            <Image source={avatarSvg1} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1003},
              shapeTwoTranslateAnimation,
            ]}
          >
            <Image source={avatarSvg2} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1004},
              shapeThreeTranslateAnimation,
            ]}
          >
            <Image source={avatarSvg3} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1005},
              shapeFourTranslateAnimation,
            ]}
          >
            <Image source={avatarSvg4} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1006},
              glassesTranslateAnimation,
            ]}
          >
            <Image source={avatarGlassesSvg} />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', zIndex: 1001},
              avatarBackgroundOpacityAnimation,
            ]}
          >
            <Image source={avatarBackgroundSvg} />
          </Animated.View>
        </Animated.View>
        <Animated.View
          style={[
            {position: 'absolute', zIndex: 1011},
            goldenAvatarRotationAnimation,
          ]}
        >
          <Image source={goldenAvatarSvg} />
        </Animated.View>
        <Animated.View
          style={[
            {position: 'absolute', right: 20, top: 25, zIndex: 1012},
            starScaleAnimation,
          ]}
        >
          <Image source={shimerStarSvg} />
        </Animated.View>
      </Stack>
      <Stack mt="$4" zIndex={1001} gap="$2">
        <Animated.View
          style={[{alignSelf: 'center'}, descriptionOpacityAnimation]}
        >
          <Text textAlign="center" ff="$heading" fos={26} col="$main">
            {t('goldenGlasses.goldenGlasses')}
          </Text>
        </Animated.View>
        <Animated.View
          style={[{alignSelf: 'center'}, descriptionOpacityAnimation]}
        >
          <Text textAlign="center" ff="$heading" fos={18} col="$white">
            {t('goldenGlasses.forJoiningMeetup')}
          </Text>
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
          <Button
            text={t('common.continue')}
            variant="secondary"
            onPress={forceHideGoldenAvatarAnimation}
          />
        </Animated.View>
      </Stack>
    </Stack>
  )
}

export default GoldenAvatarAnimation

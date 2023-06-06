import {atom, useAtom, type WritableAtom} from 'jotai'
import {Stack, Text, XStack, YStack} from 'tamagui'
import {BackHandler, ScrollView, StyleSheet, View} from 'react-native'
import Button from './Button'
import type * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import {
  type BasicError,
  toBasicError,
} from '@vexl-next/domain/dist/utility/errors'
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useFocusEffect} from '@react-navigation/native'
import React from 'react'
import {ImageUniversal, type ImageUniversalSourcePropType} from './Image'

interface Step {
  image?: ImageUniversalSourcePropType
  title: string
  description?: string
  negativeButtonText?: string
  positiveButtonText: string
}

interface AreYouSureDialogState {
  variant: 'danger' | 'info'
  steps: Step[]
  currentStep: number
  onPass: () => void
  onDismiss: () => void
}

const areYouSureDialogAtom = atom<AreYouSureDialogState | null>(null)

type UserDeclinedError = BasicError<'UserDeclinedError'>
export const askAreYouSureActionAtom: WritableAtom<
  null,
  [Omit<AreYouSureDialogState, 'onPass' | 'onDismiss' | 'currentStep'>],
  TE.TaskEither<UserDeclinedError, true>
  // eslint-disable-next-line @typescript-eslint/promise-function-async
> = atom(null, (get, set, state) => {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return () =>
    new Promise((resolve) => {
      set(areYouSureDialogAtom, {
        ...state,
        currentStep: 0,
        onPass: () => {
          resolve(E.right(true))
        },
        onDismiss: () => {
          resolve(
            E.left(toBasicError('UserDeclinedError')(new Error('Declined')))
          )
        },
      })
    })
})

const styles = StyleSheet.create({
  backdrop: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  bounce: {flex: 1, zIndex: 2},
  flip: {transform: [{scaleY: -1}]},
})

function AreYouSureDialog(): JSX.Element | null {
  const [state, setState] = useAtom(areYouSureDialogAtom)
  const insets = useSafeAreaInsets()

  useFocusEffect(
    React.useCallback(() => {
      function onBackButtonPressed(): boolean {
        if (!state) return false
        state.onDismiss()
        setState(null)
        return true
      }

      return BackHandler.addEventListener(
        'hardwareBackPress',
        onBackButtonPressed
      ).remove
    }, [setState, state])
  )

  if (!state) return null
  const step = state?.steps[state.currentStep]

  if (!step) return null

  return (
    <Stack position={'absolute'} t={0} l={0} r={0} b={0}>
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.backdrop}
      ></Animated.View>
      <Animated.View
        style={styles.bounce}
        entering={SlideInDown}
        exiting={SlideOutDown}
      >
        <YStack
          pt={insets.top}
          pl={insets.left}
          pr={insets.right}
          pb={insets.bottom}
          flex={1}
          space="$2"
        >
          <ScrollView style={styles.flip}>
            <View style={styles.flip}>
              <Stack px={'$4'} br={'$4'} mx={'$2'} py="$5" bc={'$white'}>
                {step.image && (
                  <ImageUniversal
                    style={{maxWidth: '100%'}}
                    source={step.image}
                  />
                )}
                <Text fontFamily={'$heading'} fontSize={32} color={'$black'}>
                  {step.title}
                </Text>
                {step.description && (
                  <Text fontSize={18} color={'$greyOnWhite'}>
                    {step.description}
                  </Text>
                )}
              </Stack>
            </View>
          </ScrollView>
          <XStack space="$2" m="$2" height={60}>
            {step.negativeButtonText && (
              <Button
                fullSize
                variant={state.variant === 'danger' ? 'redDark' : 'primary'}
                onPress={() => {
                  state?.onDismiss()
                  setState(null)
                }}
                text={step.negativeButtonText}
              />
            )}
            <Button
              fullSize
              onPress={() => {
                if (!state) return
                if (state.currentStep >= state.steps.length - 1) {
                  state.onPass()
                  setState(null)
                } else {
                  setState({...state, currentStep: state.currentStep + 1})
                }
              }}
              variant={state.variant === 'danger' ? 'redLight' : 'secondary'}
              text={step.positiveButtonText}
            />
          </XStack>
        </YStack>
      </Animated.View>
    </Stack>
  )
}

export default AreYouSureDialog

import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import * as E from 'fp-ts/Either'
import type * as TE from 'fp-ts/TaskEither'
import {atom, useAtom, type WritableAtom} from 'jotai'
import React, {type ComponentType, useCallback} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {type ColorTokens, Stack, Text, XStack} from 'tamagui'
import Button from './Button'
import {ImageUniversal, type ImageUniversalSourcePropType} from './Image'
import Input, {type Props as VexlTextInputProps} from './Input'
import AnimatedDialogWrapper from './AnimatedDialogWrapper'

interface StepWithText {
  type: 'StepWithText'
  image?: ImageUniversalSourcePropType
  title: string
  description?: string
  negativeButtonText?: string
  positiveButtonText: string
}

interface StepWithChildren {
  type: 'StepWithChildren'
  negativeButtonText?: string
  positiveButtonText: string
  backgroundColor?: ColorTokens
  goBackOnNegativeButtonPress?: boolean
  MainSectionComponent: ComponentType
}

interface StepWithInput {
  type: 'StepWithInput'
  negativeButtonText?: string
  positiveButtonText: string
  title: string
  description?: string
  subtitle?: string
  textInputProps: VexlTextInputProps
  defaultValue?: string
}

type Step = StepWithText | StepWithChildren | StepWithInput

type AreYouSureDialogAtomStepResult =
  | {
      type: 'noResult'
    }
  | {
      type: 'inputResult'
      value: string
    }

interface AreYouSureDialogState {
  variant: 'danger' | 'info'
  steps: Step[]
  stepResults: AreYouSureDialogAtomStepResult[]
  currentStep: number
  onPass: (result: AreYouSureDialogAtomStepResult[]) => void
  onDismiss: () => void
}

const areYouSureDialogAtom = atom<AreYouSureDialogState | null>(null)

export type UserDeclinedError = BasicError<'UserDeclinedError'>
export const askAreYouSureActionAtom: WritableAtom<
  null,
  [
    Omit<
      AreYouSureDialogState,
      'onPass' | 'onDismiss' | 'currentStep' | 'stepResults'
    >,
  ],
  TE.TaskEither<UserDeclinedError, AreYouSureDialogAtomStepResult[]>
> = atom(null, (get, set, state) => {
  return () =>
    new Promise((resolve) => {
      set(areYouSureDialogAtom, {
        ...state,
        currentStep: 0,
        stepResults: state.steps.map((step) =>
          step.type === 'StepWithInput' && step.defaultValue
            ? ({
                type: 'inputResult',
                value: step.defaultValue,
              } as const)
            : ({type: 'noResult'} as const)
        ),
        onPass: (result) => {
          resolve(E.right(result))
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
  flip: {transform: [{scaleY: -1}]},
})

function AreYouSureDialog(): JSX.Element | null {
  const [state, setState] = useAtom(areYouSureDialogAtom)

  const onBackButtonPressed = useCallback(() => {
    if (!state) return false
    state.onDismiss()
    setState(null)
    return true
  }, [setState, state])

  if (!state) return null
  const step = state?.steps[state.currentStep]

  if (!step) return null

  const stepResult = state.stepResults[state.currentStep]

  return (
    <AnimatedDialogWrapper onBackButtonPressed={onBackButtonPressed}>
      <ScrollView style={styles.flip}>
        <View style={styles.flip}>
          <Stack
            px="$4"
            br="$4"
            mx="$2"
            py="$5"
            bc={
              step.type === 'StepWithChildren' && step.backgroundColor
                ? step.backgroundColor
                : '$white'
            }
          >
            {step.type === 'StepWithText' ? (
              <>
                {step.image && (
                  <ImageUniversal
                    style={{maxWidth: '100%'}}
                    source={step.image}
                  />
                )}
                <Text fontFamily="$heading" fontSize={32} color="$black">
                  {step.title}
                </Text>
                {step.description && (
                  <Text fontSize={18} color="$greyOnWhite">
                    {step.description}
                  </Text>
                )}
              </>
            ) : step.type === 'StepWithInput' ? (
              <Stack space="$4">
                <Text fos={28} col="$black" ff="$heading">
                  {step.title}
                </Text>
                <Text fos={18} col="$greyOnWhite" ff="$body500">
                  {step.description}
                </Text>
                <Text fos={18} col="$black" ff="$heading">
                  {step.subtitle}
                </Text>
                <Input
                  value={
                    stepResult?.type === 'inputResult' ? stepResult.value : ''
                  }
                  onChangeText={(value) => {
                    if (!state?.stepResults) return

                    setState({
                      ...state,
                      stepResults: [
                        ...state.stepResults.slice(0, state.currentStep),
                        {type: 'inputResult', value},
                        ...state.stepResults.slice(state.currentStep + 1),
                      ],
                    })
                  }}
                  {...step.textInputProps}
                />
              </Stack>
            ) : (
              <step.MainSectionComponent />
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
              if (
                step.type === 'StepWithChildren' &&
                step.goBackOnNegativeButtonPress &&
                state.currentStep > 0
              ) {
                setState({...state, currentStep: state.currentStep - 1})
              } else {
                state?.onDismiss()
                setState(null)
              }
            }}
            text={step.negativeButtonText}
          />
        )}
        <Button
          fullSize
          onPress={() => {
            if (!state) return
            if (state.currentStep >= state.steps.length - 1) {
              state.onPass(state.stepResults)
              setState(null)
            } else {
              setState({...state, currentStep: state.currentStep + 1})
            }
          }}
          variant={state.variant === 'danger' ? 'redLight' : 'secondary'}
          text={step.positiveButtonText}
        />
      </XStack>
    </AnimatedDialogWrapper>
  )
}

export default AreYouSureDialog

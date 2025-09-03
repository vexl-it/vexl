import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {Effect, Either} from 'effect'
import {atom, useAtom, useAtomValue, type Atom, type WritableAtom} from 'jotai'
import React, {useCallback, type ComponentType} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {Stack, Text, type ColorTokens} from 'tamagui'
import AnimatedDialogWrapper from './AnimatedDialogWrapper'
import Button from './Button'
import {ImageUniversal, type ImageUniversalProps} from './Image'
import Input, {type Props as VexlTextInputProps} from './Input'

export interface StepWithText {
  type: 'StepWithText'
  textAlign?: 'center' | 'left' | 'right'
  emojiTop?: string
  imageSource?: ImageUniversalProps['source']
  title: string
  description?: string
  negativeButtonText?: string
  positiveButtonText: string
  positiveButtonDisabledAtom?: Atom<boolean>
}

export interface StepWithChildren<T> {
  type: 'StepWithChildren'
  negativeButtonText?: string
  positiveButtonText: string
  backgroundColor?: ColorTokens
  goBackOnNegativeButtonPress?: boolean
  MainSectionComponent: ComponentType<T>
  mainSectionComponentProps?: T
  positiveButtonDisabledAtom?: Atom<boolean>
}

interface StepWithInput {
  autoFocus?: boolean
  type: 'StepWithInput'
  negativeButtonText?: string
  positiveButtonText: string
  title: string
  description?: string
  subtitle?: string
  textInputProps: VexlTextInputProps
  defaultValue?: string
  positiveButtonDisabledAtom?: Atom<boolean>
}

type Step = StepWithText | StepWithChildren<any> | StepWithInput

export type AreYouSureDialogAtomStepResult =
  | {
      type: 'noResult'
    }
  | {
      type: 'inputResult'
      value: string
    }

interface AreYouSureDialogState {
  variant: 'danger' | 'info'
  makeSureOnDeny?: boolean
  buttonsDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  steps: Step[]
  stepResults: AreYouSureDialogAtomStepResult[]
  currentStep: number
  onPass: (result: AreYouSureDialogAtomStepResult[]) => void
  onDismiss: () => void
}

const areYouSureDialogAtom = atom<AreYouSureDialogState | null>(null)

export type UserDeclinedError = BasicError<'UserDeclinedError'>
export const forceHideAskAreYouSureActionAtom = atom(null, (_, set) => {
  set(areYouSureDialogAtom, null)
})
export const askAreYouSureActionAtom: WritableAtom<
  null,
  [
    Omit<
      AreYouSureDialogState,
      'onPass' | 'onDismiss' | 'currentStep' | 'stepResults'
    >,
  ],
  Effect.Effect<AreYouSureDialogAtomStepResult[], UserDeclinedError>
> = atom(null, (_, set, state) => {
  return Effect.async((resolve) => {
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
        resolve(Either.right(result))
      },
      onDismiss: () => {
        resolve(
          Either.left(toBasicError('UserDeclinedError')(new Error('Declined')))
        )
      },
    })
  })
})

const styles = StyleSheet.create({
  flip: {transform: [{scaleY: -1}]},
})

const falseAtom = atom(false)

function AreYouSureDialog(): React.ReactElement | null {
  const [state, setState] = useAtom(areYouSureDialogAtom)
  const positiveButtonDisabled = useAtomValue(
    state?.steps[state.currentStep]?.positiveButtonDisabledAtom ?? falseAtom
  )

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
              <Stack gap="$2">
                {!!step.imageSource && (
                  <Stack als="center" my="$4">
                    <ImageUniversal
                      width={140}
                      height={140}
                      style={{borderRadius: 24}}
                      source={step.imageSource}
                    />
                  </Stack>
                )}
                {!!step.emojiTop && (
                  <Text fontSize={120} textAlign={step.textAlign ?? 'left'}>
                    {step.emojiTop}
                  </Text>
                )}
                <Text
                  fontFamily="$heading"
                  fontSize={24}
                  color="$black"
                  textAlign={step.textAlign ?? 'left'}
                >
                  {step.title}
                </Text>
                {!!step.description && (
                  <Text
                    fontSize={18}
                    color="$greyOnWhite"
                    textAlign={step.textAlign ?? 'left'}
                  >
                    {step.description}
                  </Text>
                )}
              </Stack>
            ) : step.type === 'StepWithInput' ? (
              <Stack gap="$2">
                <Text fos={24} col="$black" ff="$heading">
                  {step.title}
                </Text>
                <Text fos={18} col="$greyOnWhite" ff="$body500">
                  {step.description}
                </Text>
                <Text fos={18} col="$black" ff="$body500">
                  {step.subtitle}
                </Text>
                <Input
                  autoFocus={step.autoFocus}
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
              <step.MainSectionComponent
                {...(step.mainSectionComponentProps ?? {})}
              />
            )}
          </Stack>
        </View>
      </ScrollView>
      <Stack
        flexDirection={state?.buttonsDirection ?? 'row'}
        gap="$2"
        m="$2"
        height={state?.buttonsDirection?.startsWith('column') ? 120 : 60}
      >
        {!!step.negativeButtonText && (
          <Button
            testID="@areYouSureDialog/negativeButton"
            fullSize
            size={
              state?.buttonsDirection?.startsWith('column')
                ? 'large'
                : undefined
            }
            variant={state.variant === 'danger' ? 'redDark' : 'primary'}
            onPress={() => {
              if (state.makeSureOnDeny) {
                if (state.currentStep >= state.steps.length - 1) {
                  state.onDismiss()
                }
                setState({...state, currentStep: state.currentStep + 1})
              } else if (
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
          testID="@areYouSureDialog/positiveButton"
          fullSize
          disabled={positiveButtonDisabled}
          size={
            state?.buttonsDirection?.startsWith('column') ? 'large' : undefined
          }
          onPress={() => {
            if (!state) return
            if (state.makeSureOnDeny) {
              state.onPass(state.stepResults)
              setState(null)
            } else if (state.currentStep >= state.steps.length - 1) {
              state.onPass(state.stepResults)
              setState(null)
            } else {
              setState({...state, currentStep: state.currentStep + 1})
            }
          }}
          variant={state.variant === 'danger' ? 'redLight' : 'secondary'}
          text={step.positiveButtonText}
        />
      </Stack>
    </AnimatedDialogWrapper>
  )
}

export default AreYouSureDialog

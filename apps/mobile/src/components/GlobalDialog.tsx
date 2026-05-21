import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {
  createDialogAtom,
  DialogFromAtom,
  Input,
  Stack,
  Typography,
  useTheme,
} from '@vexl-next/ui'
import {Effect, Either} from 'effect'
import {atom, useAtom, type Atom, type WritableAtom} from 'jotai'
import React from 'react'
import {ImageUniversal, type ImageUniversalProps} from './Image'

export const globalDialogAtom = createDialogAtom()

type UiInputProps = React.ComponentProps<typeof Input>
type DialogBackgroundColor = React.ComponentProps<
  typeof Stack
>['backgroundColor']

interface DialogTextInputProps
  extends Omit<UiInputProps, 'autoFocus' | 'onChangeText' | 'value'> {
  readonly icon?: unknown
  readonly onClearPress?: () => void
  readonly showClearButton?: boolean
}

function getUiInputProps({
  icon: _icon,
  onClearPress: _onClearPress,
  showClearButton: _showClearButton,
  ...inputProps
}: DialogTextInputProps): Omit<
  DialogTextInputProps,
  'icon' | 'onClearPress' | 'showClearButton'
> {
  return inputProps
}

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
  backgroundColor?: DialogBackgroundColor
  goBackOnNegativeButtonPress?: boolean
  MainSectionComponent: React.ComponentType<T>
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
  textInputProps: DialogTextInputProps
  defaultValue?: string
  positiveButtonDisabledAtom?: Atom<boolean>
}

type Step = StepWithText | StepWithChildren<any> | StepWithInput

export type GlobalDialogStepResult =
  | {
      type: 'noResult'
    }
  | {
      type: 'inputResult'
      value: string
    }

interface ConfirmDialogState {
  variant: 'danger' | 'info'
  makeSureOnDeny?: boolean
  buttonsDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  steps: Step[]
}

export type UserDeclinedError = BasicError<'UserDeclinedError'>

export const forceHideGlobalDialogActionAtom = atom(null, (_, set) => {
  set(globalDialogAtom, null)
})

function createInitialStepResult(step: Step): GlobalDialogStepResult {
  if (step.type === 'StepWithInput' && step.defaultValue != null) {
    return {
      type: 'inputResult',
      value: step.defaultValue,
    }
  }

  return {type: 'noResult'}
}

function toUserDeclinedError(): UserDeclinedError {
  return toBasicError('UserDeclinedError')(new Error('Declined'))
}

function positiveButtonVariant(
  variant: ConfirmDialogState['variant']
): 'destructive' | undefined {
  return variant === 'danger' ? 'destructive' : undefined
}

function DialogStepTextContent({
  step,
}: {
  step: StepWithText
}): React.ReactElement | null {
  if (!step.emojiTop && !step.imageSource) return null

  return (
    <Stack
      gap="$3"
      alignItems={step.textAlign === 'center' ? 'center' : undefined}
    >
      {!!step.imageSource && (
        <ImageUniversal
          width={140}
          height={140}
          style={{borderRadius: 24}}
          source={step.imageSource}
        />
      )}
      {!!step.emojiTop && (
        <Typography
          variant="heading1"
          color="$foregroundPrimary"
          fontSize={72}
          lineHeight={84}
          textAlign={step.textAlign ?? 'left'}
        >
          {step.emojiTop}
        </Typography>
      )}
    </Stack>
  )
}

function createInputContent({
  step,
  valueAtom,
}: {
  step: StepWithInput
  valueAtom: WritableAtom<string, [string], void>
}): React.ReactElement {
  function InputContent(): React.ReactElement {
    const [value, setValue] = useAtom(valueAtom)
    const theme = useTheme()
    const textInputProps = getUiInputProps(step.textInputProps)

    return (
      <Stack gap="$3">
        {!!step.subtitle && (
          <Typography variant="paragraph" color="$foregroundPrimary">
            {step.subtitle}
          </Typography>
        )}
        <Stack
          alignItems="center"
          backgroundColor="$backgroundSecondary"
          borderRadius="$5"
          borderWidth={1}
          borderColor="transparent"
          minHeight="$11"
          paddingHorizontal="$5"
          justifyContent="center"
        >
          <Input
            unstyled
            alignSelf="stretch"
            color="$foregroundPrimary"
            fontFamily="$body"
            fontSize="$4"
            fontWeight="500"
            placeholderTextColor={theme.foregroundTertiary.get()}
            selectionColor={theme.accentYellowPrimary.get()}
            autoFocus={step.autoFocus}
            value={value}
            onChangeText={setValue}
            {...textInputProps}
          />
        </Stack>
      </Stack>
    )
  }

  return <InputContent />
}

function stepTitle(step: Step): string | undefined {
  if (step.type === 'StepWithChildren') return undefined
  return step.title
}

function stepSubtitle(step: Step): string | undefined {
  if (step.type === 'StepWithChildren') return undefined
  return step.description
}

function stepChildren({
  step,
  inputValueAtom,
}: {
  step: Step
  inputValueAtom: WritableAtom<string, [string], void> | undefined
}): React.ReactElement | null {
  if (step.type === 'StepWithChildren') {
    return React.createElement(
      step.MainSectionComponent,
      step.mainSectionComponentProps
    )
  }

  if (step.type === 'StepWithInput' && inputValueAtom != null) {
    return createInputContent({step, valueAtom: inputValueAtom})
  }

  if (step.type === 'StepWithText') {
    return <DialogStepTextContent step={step} />
  }

  return null
}

export const askGlobalDialogActionAtom: WritableAtom<
  null,
  [ConfirmDialogState],
  Effect.Effect<GlobalDialogStepResult[], UserDeclinedError>
> = atom(null, (get, set, state) => {
  return Effect.async((resolve) => {
    const results = state.steps.map(createInitialStepResult)

    const runStep = (stepIndex: number): void => {
      const step = state.steps[stepIndex]

      if (step == null) {
        resolve(Either.right(results))
        return
      }

      const inputValueAtom =
        step.type === 'StepWithInput'
          ? atom(step.defaultValue ?? '')
          : undefined

      Effect.runFork(
        set(globalDialogAtom, {
          title: stepTitle(step),
          subtitle: stepSubtitle(step),
          children: stepChildren({step, inputValueAtom}),
          positiveButtonText: step.positiveButtonText,
          positiveButtonDisabledAtom: step.positiveButtonDisabledAtom,
          positiveButtonVariant: positiveButtonVariant(state.variant),
          negativeButtonText: step.negativeButtonText,
        }).pipe(
          Effect.match({
            onFailure: () => {
              resolve(Either.left(toUserDeclinedError()))
            },
            onSuccess: (confirmed) => {
              if (!confirmed) {
                if (
                  state.makeSureOnDeny &&
                  stepIndex < state.steps.length - 1
                ) {
                  runStep(stepIndex + 1)
                  return
                }

                resolve(Either.left(toUserDeclinedError()))
                return
              }

              if (step.type === 'StepWithInput' && inputValueAtom != null) {
                results[stepIndex] = {
                  type: 'inputResult',
                  value: get(inputValueAtom),
                }
              }

              if (state.makeSureOnDeny || stepIndex >= state.steps.length - 1) {
                resolve(Either.right(results))
                return
              }

              runStep(stepIndex + 1)
            },
          })
        )
      )
    }

    runStep(0)
  })
})

export const askAreYouSureActionAtom = askGlobalDialogActionAtom
export const forceHideAskAreYouSureActionAtom = forceHideGlobalDialogActionAtom
export type GlobalDialogAtomStepResult = GlobalDialogStepResult

export function GlobalDialog(): React.JSX.Element {
  return <DialogFromAtom dialogAtom={globalDialogAtom} />
}

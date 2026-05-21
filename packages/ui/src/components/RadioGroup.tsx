import {Array, Option, pipe} from 'effect'
import React from 'react'
import {RadioGroup as TamaguiRadioGroup} from 'tamagui'

type TamaguiRadioGroupProps = React.ComponentProps<typeof TamaguiRadioGroup>

export type RadioGroupProps<T extends string = string> = Omit<
  TamaguiRadioGroupProps,
  'defaultValue' | 'onValueChange' | 'value'
> & {
  readonly allowedValues: readonly T[]
  readonly value?: T
  readonly defaultValue?: T
  readonly onValueChange?: (value: T) => void
  readonly onSelectedValuePress?: (value: T) => void
}

const RadioGroupValueContext = React.createContext<string | undefined>(
  undefined
)
const RadioGroupSelectedValuePressContext = React.createContext<
  ((value: string) => void) | undefined
>(undefined)

export function useRadioGroupValue(): string | undefined {
  return React.useContext(RadioGroupValueContext)
}

export function useRadioGroupSelectedValuePress():
  | ((value: string) => void)
  | undefined {
  return React.useContext(RadioGroupSelectedValuePressContext)
}

export function RadioGroup<T extends string>(
  props: RadioGroupProps<T>
): React.JSX.Element {
  const {
    allowedValues,
    children,
    defaultValue,
    onSelectedValuePress,
    onValueChange,
    value,
    ...rest
  } = props
  const [internalValue, setInternalValue] = React.useState<T | undefined>(
    defaultValue
  )
  const isControlled = 'value' in props

  const currentValue = isControlled ? value : internalValue

  const handleValueChange = (nextValue: string): void => {
    pipe(
      allowedValues,
      Array.findFirst((allowedValue) => allowedValue === nextValue),
      Option.match({
        onNone: () => {},
        onSome: (matchedValue) => {
          if (!isControlled) setInternalValue(matchedValue)
          onValueChange?.(matchedValue)
        },
      })
    )
  }

  const handleSelectedValuePress = (nextValue: string): void => {
    pipe(
      allowedValues,
      Array.findFirst((allowedValue) => allowedValue === nextValue),
      Option.match({
        onNone: () => {},
        onSome: (matchedValue) => {
          onSelectedValuePress?.(matchedValue)
        },
      })
    )
  }

  return (
    <RadioGroupValueContext.Provider value={currentValue}>
      <RadioGroupSelectedValuePressContext.Provider
        value={onSelectedValuePress ? handleSelectedValuePress : undefined}
      >
        <TamaguiRadioGroup
          {...rest}
          value={currentValue}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
        >
          {children}
        </TamaguiRadioGroup>
      </RadioGroupSelectedValuePressContext.Provider>
    </RadioGroupValueContext.Provider>
  )
}

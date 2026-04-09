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
}

const RadioGroupValueContext = React.createContext<string | undefined>(
  undefined
)

export function useRadioGroupValue(): string | undefined {
  return React.useContext(RadioGroupValueContext)
}

export function RadioGroup<T extends string>({
  allowedValues,
  children,
  defaultValue,
  onValueChange,
  value,
  ...rest
}: RadioGroupProps<T>): React.JSX.Element {
  const [internalValue, setInternalValue] = React.useState<T | undefined>(
    defaultValue
  )

  const currentValue = value ?? internalValue

  const handleValueChange = (nextValue: string): void => {
    pipe(
      allowedValues,
      Array.findFirst((allowedValue) => allowedValue === nextValue),
      Option.match({
        onNone: () => {},
        onSome: (matchedValue) => {
          setInternalValue(matchedValue)
          onValueChange?.(matchedValue)
        },
      })
    )
  }

  return (
    <RadioGroupValueContext.Provider value={currentValue}>
      <TamaguiRadioGroup
        {...rest}
        value={currentValue}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
      >
        {children}
      </TamaguiRadioGroup>
    </RadioGroupValueContext.Provider>
  )
}

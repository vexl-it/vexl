import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import type {TextInput, TextInputProps} from 'react-native'
import {getTokens, useTheme} from 'tamagui'

import {Checkmark} from '../icons/Checkmark'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import type {IconProps} from '../icons/types'
import {Stack, YStack} from '../primitives'
import {Button} from './Button'
import {FieldFrame, FieldInput} from './Field'
import {LengthCounter} from './LengthCounter'
import {NavButton} from './NavButton'

type FieldFrameProps = React.ComponentProps<typeof FieldFrame>

type NativeInputProps = Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'autoFocus'
  | 'editable'
  | 'keyboardType'
  | 'maxLength'
  | 'onSubmitEditing'
  | 'returnKeyType'
  | 'secureTextEntry'
  | 'submitBehavior'
  | 'textContentType'
>

interface TextFieldBaseProps
  extends
    Omit<
      FieldFrameProps,
      'children' | 'highlighted' | 'selected' | 'pressable' | 'ref'
    >,
    NativeInputProps {
  readonly placeholder?: string
  readonly showClear?: boolean
  readonly onCheckmarkPress?: () => void
  readonly buttonLabel?: string
  readonly onButtonPress?: () => void
  readonly icon?: React.ComponentType<IconProps>
  readonly onIconPress?: () => void
  readonly ref?: React.Ref<TextInput>
}

interface ControlledTextFieldProps extends TextFieldBaseProps {
  readonly value: string
  readonly onChangeText: (text: string) => void
  readonly valueAtom?: never
}

interface AtomTextFieldProps extends TextFieldBaseProps {
  readonly valueAtom: WritableAtom<string, [SetStateAction<string>], void>
  readonly value?: never
  readonly onChangeText?: never
}

export type TextFieldProps = ControlledTextFieldProps | AtomTextFieldProps

export function TextField(props: TextFieldProps): React.JSX.Element {
  if (props.valueAtom !== undefined) {
    const {valueAtom, ...rest} = props
    return <AtomTextField valueAtom={valueAtom} {...rest} />
  }

  return <ControlledTextField {...props} />
}

function AtomTextField({
  valueAtom,
  ...rest
}: AtomTextFieldProps): React.JSX.Element {
  const [value, setValue] = useAtom(valueAtom)
  return <ControlledTextField value={value} onChangeText={setValue} {...rest} />
}

function ControlledTextField({
  value,
  onChangeText,
  placeholder = 'Input',
  backgroundColor = '$backgroundSecondary',
  showClear,
  onCheckmarkPress,
  buttonLabel,
  onButtonPress,
  icon: Icon,
  onIconPress,
  ref,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  editable,
  keyboardType,
  maxLength,
  onSubmitEditing,
  returnKeyType,
  secureTextEntry,
  submitBehavior,
  textContentType,
  ...rest
}: ControlledTextFieldProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false)
  const theme = useTheme()
  const iconSize = getTokens().size.$7.val

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  const handleClear = useCallback(() => {
    onChangeText('')
  }, [onChangeText])

  const hasButton = buttonLabel != null && onButtonPress != null
  const hasCheckmark = onCheckmarkPress != null
  const TrailingIcon =
    showClear === true && value.length > 0 ? XmarkCancelClose : Icon
  const onTrailingIconPress =
    TrailingIcon === XmarkCancelClose ? handleClear : onIconPress

  const field = (
    <FieldFrame
      backgroundColor={backgroundColor}
      highlighted={(hasCheckmark && isFocused) || undefined}
      paddingLeft={hasButton ? '$4' : '$5'}
      paddingRight="$3"
      paddingVertical={hasButton ? '$3' : '$0'}
      {...rest}
    >
      <FieldInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.foregroundTertiary.get()}
        selectionColor={theme.accentYellowPrimary.get()}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        autoFocus={autoFocus}
        editable={editable}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        submitBehavior={submitBehavior}
        textContentType={textContentType}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {hasButton ? (
        <Button variant="secondary" size="small" onPress={onButtonPress}>
          {buttonLabel}
        </Button>
      ) : hasCheckmark ? (
        <NavButton icon={Checkmark} onPress={onCheckmarkPress} />
      ) : TrailingIcon != null ? (
        <Stack
          role="button"
          alignItems="center"
          justifyContent="center"
          paddingRight="$2"
          pressStyle={{opacity: 0.7}}
          onPress={onTrailingIconPress}
        >
          <TrailingIcon size={iconSize} color={theme.foregroundPrimary.get()} />
        </Stack>
      ) : null}
    </FieldFrame>
  )

  if (maxLength === undefined) return field

  return (
    <YStack gap="$2">
      {field}
      <LengthCounter length={value.length} maxLength={maxLength} />
    </YStack>
  )
}

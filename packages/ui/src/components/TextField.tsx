import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React, {useCallback, useState} from 'react'
import {styled, useTheme} from 'tamagui'

import {Checkmark} from '../icons/Checkmark'
import {XmarkCancelClose} from '../icons/XmarkCancelClose'
import type {IconProps} from '../icons/types'
import {Input, Stack, XStack} from '../primitives'
import {Button} from './Button'

const TextFieldFrame = styled(XStack, {
  name: 'TextField',
  alignItems: 'center',
  alignSelf: 'stretch',
  backgroundColor: '$backgroundSecondary',
  borderRadius: '$5',
  borderWidth: 1,
  borderColor: 'transparent',

  variants: {
    layout: {
      standard: {
        height: '$11',
        paddingLeft: '$5',
        paddingRight: '$3',
        paddingVertical: '$5',
      },
      compact: {
        paddingLeft: '$4',
        paddingRight: '$3',
        paddingVertical: '$3',
      },
    },

    highlighted: {
      true: {
        borderColor: '$accentHighlightSecondary',
      },
    },
  } as const,

  defaultVariants: {
    layout: 'standard',
  },
})

const TextFieldInput = styled(Input, {
  name: 'TextFieldInput',
  unstyled: true,
  flex: 1,
  fontFamily: '$body',
  fontWeight: '500',
  fontSize: '$4',
  color: '$foregroundPrimary',
  padding: 0,
})

const CheckmarkButtonFrame = styled(Stack, {
  name: 'TextFieldCheckmarkButton',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  width: '$9',
  height: '$9',
  borderRadius: '$3',
  backgroundColor: '$accentYellowSecondary',

  pressStyle: {
    opacity: 0.7,
  },
})

const IconPressable = styled(Stack, {
  name: 'TextFieldIconPressable',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  paddingRight: '$2',

  pressStyle: {
    opacity: 0.7,
  },
})

type TextFieldFrameProps = React.ComponentProps<typeof TextFieldFrame>

export interface TextFieldProps
  extends Omit<TextFieldFrameProps, 'children' | 'layout' | 'highlighted'> {
  readonly valueAtom: WritableAtom<string, [SetStateAction<string>], void>
  readonly placeholder?: string
  readonly autoFocus?: boolean
  readonly showClear?: boolean
  readonly onCheckmarkPress?: () => void
  readonly buttonLabel?: string
  readonly onButtonPress?: () => void
  readonly icon?: React.ComponentType<IconProps>
  readonly onIconPress?: () => void
}

export function TextField({
  valueAtom,
  placeholder = 'Input',
  autoFocus,
  showClear,
  onCheckmarkPress,
  buttonLabel,
  onButtonPress,
  icon: Icon,
  onIconPress,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const [text, setText] = useAtom(valueAtom)
  const [isFocused, setIsFocused] = useState(false)
  const theme = useTheme()
  const hasText = text.length > 0

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  const handleClear = useCallback(() => {
    setText('')
  }, [setText])

  const hasCheckmark = onCheckmarkPress != null
  const isCompact = buttonLabel != null && onButtonPress != null
  const showBorder = hasCheckmark && isFocused

  return (
    <TextFieldFrame
      layout={isCompact ? 'compact' : 'standard'}
      highlighted={showBorder || undefined}
      {...rest}
    >
      <TextFieldInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={theme.foregroundTertiary.val}
        selectionColor={theme.accentYellowPrimary.val}
        autoFocus={autoFocus}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {buttonLabel != null && onButtonPress != null ? (
        <Button variant="secondary" size="small" onPress={onButtonPress}>
          {buttonLabel}
        </Button>
      ) : onCheckmarkPress != null ? (
        <CheckmarkButtonFrame onPress={onCheckmarkPress}>
          <Checkmark size={24} color={theme.accentHighlightPrimary.val} />
        </CheckmarkButtonFrame>
      ) : showClear === true && hasText ? (
        <IconPressable onPress={handleClear}>
          <XmarkCancelClose size={24} color={theme.foregroundPrimary.val} />
        </IconPressable>
      ) : Icon != null ? (
        <IconPressable onPress={onIconPress}>
          <Icon size={24} color={theme.foregroundPrimary.val} />
        </IconPressable>
      ) : null}
    </TextFieldFrame>
  )
}

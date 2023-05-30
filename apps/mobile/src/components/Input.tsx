import {
  TextInput as RNTextInput,
  type TextInputProps,
  TouchableOpacity,
} from 'react-native'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import Image from './Image'
import {
  Stack,
  XStack,
  styled,
  type XStackProps,
  getTokens,
  type ColorTokens,
  Text,
} from 'tamagui'
import closeSvg from './images/closeSvg'
import {
  type ComponentProps,
  forwardRef,
  type ReactNode,
  type Ref,
  useImperativeHandle,
  useRef,
} from 'react'

const RootContainer = styled(XStack, {
  ai: 'center',
  br: '$4',
  variants: {
    size: {
      small: {
        p: '$2',
      },
      medium: {
        p: '$4',
      },
    },
    variant: {
      greyOnWhite: {
        bc: '$greyAccent5',
      },
      greyOnBlack: {
        bc: '$grey',
      },
      transparentOnGrey: {
        bc: 'transparent',
        p: '$0',
      },
    },
  } as const,
})

const InputStyled = styled(RNTextInput, {
  f: 1,
  ff: '$body500',
  variants: {
    size: {
      small: {
        fos: 16,
      },
      medium: {
        fos: 18,
      },
    },
    variant: {
      greyOnWhite: {
        color: '$darkColorText',
      },
      greyOnBlack: {
        color: '$main',
      },
      transparentOnGrey: {
        color: '$greyOnBlack',
      },
    },
    textColor: {
      '...color': (color) => {
        return {
          color,
        }
      },
    },
  } as const,
})

const StyledText = styled(Text, {
  fos: 18,
  variants: {
    variant: {
      greyOnWhite: {
        color: '$darkColorText',
      },
      greyOnBlack: {
        color: '$main',
      },
      transparentOnGrey: {
        color: '$greyOnBlack',
      },
    },
    textColor: {
      '...color': (color) => {
        return {
          color,
        }
      },
    },
  } as const,
})

export interface Props extends Omit<TextInputProps, 'style'> {
  icon?: SvgString
  leftText?: string
  rightText?: string
  size?: 'small' | 'medium'
  showClearButton?: boolean
  onClearPress?: () => void
  style?: XStackProps
  textColor?: ColorTokens
  leftTextColor?: ColorTokens
  rightTextColor?: ColorTokens
  variant?: 'greyOnWhite' | 'greyOnBlack' | 'transparentOnGrey'
  rightElement?: ReactNode
  borderRadius?: ComponentProps<typeof RootContainer>['borderRadius']
  numberOfLines?: ComponentProps<typeof InputStyled>['numberOfLines']
  multiline?: ComponentProps<typeof InputStyled>['multiline']
}

function TextInput(
  {
    style,
    size = 'medium',
    icon,
    leftText,
    rightText,
    showClearButton,
    onClearPress,
    leftTextColor = '$greyOnBlack',
    rightTextColor = '$greyOnBlack',
    textColor,
    variant = 'greyOnWhite',
    rightElement,
    borderRadius,
    multiline,
    numberOfLines,
    ...restProps
  }: Props,
  ref: Ref<RNTextInput>
): JSX.Element {
  const tokens = getTokens()
  const inputRef: Ref<RNTextInput> = useRef(null)
  useImperativeHandle<RNTextInput | null, RNTextInput | null>(
    ref,
    () => inputRef.current
  )

  return (
    <RootContainer
      variant={variant}
      size={size}
      borderRadius={borderRadius ?? '$4'}
      {...style}
    >
      {icon && (
        <Stack mr="$2">
          <Stack w={size === 'small' ? 14 : 20} h={size === 'small' ? 14 : 20}>
            <Image
              stroke={
                variant === 'greyOnBlack'
                  ? tokens.color.white.val
                  : tokens.color.grey.val
              }
              source={icon}
            />
          </Stack>
        </Stack>
      )}
      {leftText && (
        <StyledText mr="$2" variant={variant} textColor={leftTextColor}>
          {leftText}
        </StyledText>
      )}
      <InputStyled
        multiline={multiline}
        ref={inputRef}
        textAlignVertical={numberOfLines ? 'top' : 'center'}
        numberOfLines={numberOfLines}
        placeholderTextColor={tokens.color.greyAccent2.val}
        selectionColor={
          variant === 'greyOnBlack'
            ? tokens.color.main.val
            : variant === 'transparentOnGrey'
            ? tokens.color.greyOnBlack.val
            : tokens.color.darkColorText.val
        }
        size={size}
        variant={variant}
        textColor={textColor}
        {...restProps}
      />
      {showClearButton && (
        <TouchableOpacity
          onPress={() => {
            inputRef.current?.clear()
            onClearPress?.()
          }}
        >
          <Image stroke={tokens.color.greyOnBlack.val} source={closeSvg} />
        </TouchableOpacity>
      )}
      {rightText && (
        <StyledText ml="$2" variant={variant} textColor={rightTextColor}>
          {rightText}
        </StyledText>
      )}
      {rightElement ?? null}
    </RootContainer>
  )
}

export default forwardRef<RNTextInput, Props>(TextInput)

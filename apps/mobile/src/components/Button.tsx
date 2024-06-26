import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {useCallback, useMemo} from 'react'
import {
  TouchableOpacity,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {Stack, Text, getTokens, styled} from 'tamagui'
import Image from './Image'

export interface Props {
  onPress: () => void
  variant:
    | 'primary'
    | 'secondary'
    | 'black'
    | 'blackOnDark'
    | 'link'
    | 'hint'
    | 'redDark'
    | 'redLight'
  text?: string
  style?: StyleProp<ViewStyle>

  disabled?: boolean
  afterIcon?: SvgString
  beforeIcon?: SvgString
  iconSize?: number
  iconFill?: ColorValue
  fullWidth?: boolean
  fullSize?: boolean
  size?: 'small' | 'medium' | 'large'
  adjustTextToFitOneLine?: boolean
  numberOfLines?: number
}

const PressableStyled = styled(Stack, {
  fd: 'row',
  ai: 'center',
  jc: 'center',
  br: '$5',
  variants: {
    variant: {
      primary: {
        bg: '$darkBrown',
      },
      secondary: {
        bg: '$main',
      },
      black: {
        bg: '$black',
      },
      blackOnDark: {
        bg: '$grey',
      },
      link: {
        bg: 'transparent',
        h: 'auto',
      },
      hint: {
        bc: '$pinkAccent2',
      },
      redDark: {
        bc: '$darkRed',
      },
      redLight: {
        bc: '$red',
      },
    },
    disabled: {
      true: {
        bg: '$grey',
      },
    },
    size: {
      small: {
        h: 38,
        px: '$3',
      },
      medium: {
        h: 48,
        px: '$4',
      },
      large: {
        h: 60,
        px: '$4',
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    fullSize: {
      true: {
        flex: 1,
      },
    },
  } as const,
})

const TextStyled = styled(Text, {
  ff: '$body600',
  variants: {
    variant: {
      primary: {
        col: '$main',
      },
      secondary: {
        col: '$darkBrown',
      },
      black: {
        col: '$white',
      },
      blackOnDark: {
        col: '$greyOnBlack',
      },
      link: {
        col: '$red',
      },
      hint: {
        col: '$pink',
        fos: 14,
      },
      redDark: {
        col: '$red',
      },
      redLight: {
        col: '$white',
      },
    },
    disabled: {
      true: {
        col: '$greyOnWhite',
      },
    },
    size: {
      small: {
        fos: 14,
      },
      medium: {
        fos: 16,
      },
      large: {
        fos: 20,
        lh: 25,
      },
    },
  },
})

function Button({
  variant,
  text,
  onPress,
  disabled = false,
  style,
  afterIcon,
  beforeIcon,
  iconSize,
  iconFill,
  fullWidth = false,
  fullSize = false,
  adjustTextToFitOneLine = false,
  size = 'large',
  numberOfLines,
}: Props): JSX.Element {
  const tokens = getTokens()
  const onPressInner = useCallback(() => {
    if (!disabled) onPress()
  }, [disabled, onPress])
  const touchableStyles: ViewStyle = useMemo(
    () => ({
      height:
        variant === 'link'
          ? 'auto'
          : size === 'small'
            ? 38
            : size === 'medium'
              ? 48
              : 60,
      ...(fullWidth && {width: '100%'}),
      ...(fullSize && {flex: 1}),
    }),
    [variant, fullSize, fullWidth, size]
  )

  const buttonIconColor = useMemo(() => {
    if (variant === 'primary') return tokens.color.main.val
    if (variant === 'secondary') return tokens.color.darkBrown.val
    if (variant === 'black' || variant === 'redLight')
      return tokens.color.white.val
    if (variant === 'blackOnDark') return tokens.color.greyOnBlack.val
    if (variant === 'link') return tokens.color.white.val
    if (variant === 'hint') return tokens.color.pink.val
    if (variant === 'redDark') return tokens.color.red.val
  }, [
    tokens.color.darkBrown.val,
    tokens.color.greyOnBlack.val,
    tokens.color.main.val,
    tokens.color.pink.val,
    tokens.color.red.val,
    tokens.color.white.val,
    variant,
  ])

  return (
    // has to be wrapped in TouchableOpacity as tamagui does not support onPress action on
    // wrapped TouchableOpacity in styled as of v 1.11.1
    <TouchableOpacity
      disabled={disabled}
      onPress={onPressInner}
      style={touchableStyles}
    >
      <PressableStyled
        variant={variant}
        style={style}
        size={size}
        fullWidth={fullWidth}
        fullSize={fullSize}
        disabled={disabled}
      >
        {!!beforeIcon && (
          <Stack mr="$2">
            <Image
              height={iconSize ?? 18}
              width={iconSize ?? 18}
              stroke={buttonIconColor}
              fill={iconFill ?? 'none'}
              source={beforeIcon}
            />
          </Stack>
        )}
        {!!text && (
          <TextStyled
            numberOfLines={adjustTextToFitOneLine ? 1 : numberOfLines}
            adjustsFontSizeToFit={adjustTextToFitOneLine}
            ff="$body600"
            size={size}
            variant={variant}
            disabled={disabled}
          >
            {text}
          </TextStyled>
        )}
        {!!afterIcon && (
          <Stack ml="$1">
            <Image
              height={iconSize ?? 18}
              width={iconSize ?? 18}
              stroke={buttonIconColor}
              fill={iconFill ?? 'none'}
              source={afterIcon}
            />
          </Stack>
        )}
      </PressableStyled>
    </TouchableOpacity>
  )
}

export default Button

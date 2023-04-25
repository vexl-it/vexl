import {type StyleProp, TouchableOpacity, type ViewStyle} from 'react-native'
import {useCallback, useMemo} from 'react'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import Image from './Image'
import {Stack, styled, Text} from 'tamagui'

interface Props {
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
  fontSize?: number
  afterIcon?: SvgString
  fullWidth?: boolean
  fullSize?: boolean
  small?: boolean
}

const PressableStyled = styled(Stack, {
  fd: 'row',
  ai: 'center',
  jc: 'center',
  br: '$5',
  h: 60,
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
        h: 48,
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
    small: {
      true: {
        h: 38,
        px: '$3',
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
  lh: 25,
  fos: 20,
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
        col: '$white',
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
    small: {
      true: {
        fos: 14,
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
  fontSize,
  afterIcon,
  fullWidth = false,
  fullSize = false,
  small = false,
}: Props): JSX.Element {
  const onPressInner = useCallback(() => {
    if (!disabled) onPress()
  }, [disabled, onPress])
  const touchableStyles: ViewStyle = useMemo(
    () => ({
      height: variant === 'link' ? 'auto' : small ? 38 : 60,
      ...(fullWidth && {width: '100%'}),
      ...(fullSize && {flex: 1}),
    }),
    [variant, fullSize, fullWidth, small]
  )

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
        small={small}
        fullWidth={fullWidth}
        fullSize={fullSize}
        disabled={disabled}
      >
        {text && (
          <TextStyled
            ff="$body600"
            small={small}
            variant={variant}
            disabled={disabled}
          >
            {text}
          </TextStyled>
        )}
        {afterIcon && (
          <Stack ml="$1">
            <Image source={afterIcon} />
          </Stack>
        )}
      </PressableStyled>
    </TouchableOpacity>
  )
}

export default Button

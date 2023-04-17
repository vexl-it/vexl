import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import Image from './Image'
import {type StyleProp, TouchableOpacity, type ViewStyle} from 'react-native'
import {useCallback} from 'react'
import {getTokens, Stack, styled} from 'tamagui'

interface Props {
  disabled?: boolean
  icon: SvgString
  onPress: () => void
  style?: StyleProp<ViewStyle>
  variant?: 'dark' | 'light'
}

const PressableStyled = styled(Stack, {
  dsp: 'flex',
  ai: 'center',
  jc: 'center',
  br: '$5',
  p: '$3',
  variants: {
    variant: {
      dark: {
        bg: '$grey',
      },
      light: {
        bg: '$greyAccent4',
      },
    },
  },
})

const touchableStyles: ViewStyle = {
  height: 40,
  width: 40,
}

function IconButton({
  variant = 'dark',
  disabled,
  icon,
  onPress,
  style,
}: Props): JSX.Element {
  const onPressInner = useCallback(() => {
    if (!disabled) onPress()
  }, [disabled, onPress])
  const tokens = getTokens()

  return (
    // has to be wrapped in TouchableOpacity as tamagui does not support onPress action on
    // wrapped TouchableOpacity in styled as of v 1.11.1
    <TouchableOpacity
      disabled={disabled}
      onPress={onPressInner}
      style={touchableStyles}
    >
      <PressableStyled variant={variant} style={style} disabled={disabled}>
        <Image
          stroke={
            variant === 'dark' ? tokens.color.white.val : tokens.color.grey.val
          }
          source={icon}
        />
      </PressableStyled>
    </TouchableOpacity>
  )
}

export default IconButton

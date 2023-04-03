import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import Image from './Image'
import {type StyleProp, TouchableOpacity, type ViewStyle} from 'react-native'
import {useCallback} from 'react'
import styled from '@emotion/native'
import {useTheme} from '@emotion/react'
import {type Color} from '../utils/ThemeProvider/defaultTheme'

type IconButtonType = 'dark' | 'light'

interface Props {
  buttonType?: IconButtonType
  disabled?: boolean
  icon: SvgString
  iconColor?: Color
  onPress: () => void
  style?: StyleProp<ViewStyle>
}

const PressableStyled = styled(TouchableOpacity)<Pick<Props, 'buttonType'>>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(p) =>
    p.buttonType === 'dark' ? p.theme.colors.grey : '#E9E9E9'};
  border-radius: 13px;
  padding: ${(p) => String(p.theme.spacings.xs)}px;
`
function IconButton({
  buttonType = 'dark',
  disabled,
  icon,
  iconColor = 'white',
  onPress,
  style,
}: Props): JSX.Element {
  const theme = useTheme()
  const onPressInner = useCallback(() => {
    if (!disabled) onPress()
  }, [disabled, onPress])
  return (
    <PressableStyled
      buttonType={buttonType}
      onPress={onPressInner}
      style={style}
      disabled={!!disabled}
    >
      <Image stroke={theme.colors[iconColor]} source={icon} />
    </PressableStyled>
  )
}

export default IconButton

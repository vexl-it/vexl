import {Pressable, type StyleProp, Text, type ViewStyle} from 'react-native'
import styled from '@emotion/native'
import {useCallback} from 'react'

interface Props {
  onPress: () => void
  variant: 'primary' | 'secondary'
  text: string
  style?: StyleProp<ViewStyle>

  disabled?: boolean
}

interface StyledElementsProps {
  variant: 'primary' | 'secondary'
  disabled: boolean
}

const PressableStyled = styled(Pressable)<StyledElementsProps>`
  ${(props) =>
    props.variant === 'primary' &&
    `
        background-color: ${props.theme.colors.darkBrown};
    `}
  ${(props) =>
    props.variant === 'secondary' &&
    `
        background-color: ${props.theme.colors.main};;
    `}

  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  border-radius: 13px;

  ${(props) =>
    props.disabled &&
    `
    background-color: ${props.theme.colors.grey};
  `}
`

const TextStyled = styled(Text)<StyledElementsProps>`
  ${(props) =>
    props.variant === 'primary' &&
    `
        color: ${props.theme.colors.main};
    `}
  ${(props) =>
    props.variant === 'secondary' &&
    `
        color: ${props.theme.colors.darkBrown};
    `}

  font-size: 20px;
  font-weight: 600;
  line-height: 25px;
  font-family: '${(p) => p.theme.fonts.ttSatoshi600}';

  ${(props) =>
    props.disabled &&
    `
    color: #808080;
  `}
`

function Button({variant, text, onPress, disabled, style}: Props): JSX.Element {
  const onPressInner = useCallback(() => {
    if (!disabled) onPress()
  }, [disabled, onPress])
  return (
    <PressableStyled
      onPress={onPressInner}
      variant={variant}
      style={style}
      disabled={!!disabled}
    >
      <TextStyled disabled={!!disabled} variant={variant}>
        {text}
      </TextStyled>
    </PressableStyled>
  )
}

export default Button

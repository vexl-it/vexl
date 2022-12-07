import {Pressable, Text} from 'react-native'
import styled from '@emotion/native'

interface Props {
  onPress: () => void
  variant: 'primary' | 'secondary'
  text: string
}

interface StyledElementsProps {
  variant: 'primary' | 'secondary'
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
  flex: 1;
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
`

function Button({variant, text, onPress}: Props): JSX.Element {
  return (
    <PressableStyled onPress={onPress} variant={variant}>
      <TextStyled variant={variant}>{text}</TextStyled>
    </PressableStyled>
  )
}

export default Button

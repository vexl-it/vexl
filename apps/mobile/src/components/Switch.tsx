import {Switch as RnSwitch, type SwitchProps} from 'react-native'
import styled from '@emotion/native'
import {useTheme} from '@emotion/react'

interface Props extends Partial<SwitchProps> {}

const SwitchStyled = styled(RnSwitch)``

export default function Switch(props: Props): JSX.Element {
  const theme = useTheme()
  return (
    <SwitchStyled
      trackColor={{false: '#262626', true: theme.colors.main}}
      thumbColor={theme.colors.white}
      {...props}
    />
  )
}

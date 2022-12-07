import {Switch as RnSwitch, SwitchProps} from 'react-native'
import styled from '@emotion/native'
import {useTheme} from '@emotion/react'

interface Props extends Partial<SwitchProps> {}

const SwitchStyled = styled(RnSwitch)``

export default function Switch(props: Props): JSX.Element {
  const theme = useTheme()
  return (
    <SwitchStyled
      trackColor={{false: theme.colors.grey, true: theme.colors.main}}
      {...props}
    />
  )
}

import React from 'react'
import {Switch as RnSwitch, type SwitchProps} from 'react-native'
import {getTokens} from 'tamagui'

interface Props extends Partial<SwitchProps> {}

export default function Switch(props: Props): React.ReactElement {
  const tokens = getTokens()
  return (
    <RnSwitch
      ios_backgroundColor={tokens.color.grey.val}
      trackColor={{false: tokens.color.grey.val, true: tokens.color.main.val}}
      thumbColor={tokens.color.white.val}
      {...props}
    />
  )
}

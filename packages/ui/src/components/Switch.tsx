import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React from 'react'
import type {SwitchProps as RNSwitchProps} from 'react-native'
import {Platform, Switch as RNSwitch} from 'react-native'
import {useTheme} from 'tamagui'

import {Stack} from '../primitives'

// Matches the native iOS switch; react-native-web derives width from height
const webSwitchSize = {height: 31}

export interface SwitchProps extends Omit<
  RNSwitchProps,
  'value' | 'onValueChange' | 'trackColor' | 'thumbColor'
> {
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}

export function Switch({valueAtom, ...rest}: SwitchProps): React.JSX.Element {
  const [isOn, setIsOn] = useAtom(valueAtom)
  const theme = useTheme()

  return (
    <Stack height="$9" alignItems="center" justifyContent="center">
      <RNSwitch
        value={isOn}
        onValueChange={(next) => {
          setIsOn(next)
        }}
        trackColor={{
          false: theme.backgroundTertiary.get(),
          true: theme.accentHighlightSecondary.get(),
        }}
        thumbColor={theme.white100.get()}
        // react-native-web ignores thumbColor when on and the prop is untyped
        {...{activeThumbColor: theme.white100.get()}}
        {...rest}
        style={[Platform.OS === 'web' && webSwitchSize, rest.style]}
      />
    </Stack>
  )
}

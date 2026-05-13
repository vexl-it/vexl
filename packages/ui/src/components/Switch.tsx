import type {SetStateAction, WritableAtom} from 'jotai'
import {useAtom} from 'jotai'
import React from 'react'
import type {SwitchProps as RNSwitchProps} from 'react-native'
import {Switch as RNSwitch} from 'react-native'
import {useTheme} from 'tamagui'

export interface SwitchProps
  extends Omit<
    RNSwitchProps,
    'value' | 'onValueChange' | 'trackColor' | 'thumbColor'
  > {
  readonly valueAtom: WritableAtom<boolean, [SetStateAction<boolean>], void>
}

export function Switch({valueAtom, ...rest}: SwitchProps): React.JSX.Element {
  const [isOn, setIsOn] = useAtom(valueAtom)
  const theme = useTheme()

  return (
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
      {...rest}
    />
  )
}

import {ChevronDown} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {XStack, useTheme} from 'tamagui'
import {tradePriceTypeAtom} from '../../../atoms'
import PriceTypeIndicator from '../../PriceTypeIndicator'

function SwitchTradePriceTypeButton(
  props: TouchableOpacityProps
): React.ReactElement {
  const theme = useTheme()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  return (
    <TouchableOpacity activeOpacity={0.7} {...props}>
      <XStack ai="center" gap="$2">
        <PriceTypeIndicator />
        <ChevronDown
          color={
            !tradePriceType || tradePriceType === 'live'
              ? theme.accentHighlightSecondary.get()
              : tradePriceType === 'frozen'
                ? theme.pinkForeground.get()
                : theme.greenForeground.get()
          }
          size={20}
        />
      </XStack>
    </TouchableOpacity>
  )
}

export default SwitchTradePriceTypeButton

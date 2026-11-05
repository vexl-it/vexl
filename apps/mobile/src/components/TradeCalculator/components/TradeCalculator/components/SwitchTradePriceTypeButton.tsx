import {ChevronDown, XStack, useTheme} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {tradePriceTypeAtom} from '../../../atoms'
import PriceTypeIndicator from '../../PriceTypeIndicator'

function SwitchTradePriceTypeButton({
  onPress,
}: {
  readonly onPress: () => void
}): React.ReactElement {
  const theme = useTheme()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)
  return (
    <XStack
      role="button"
      ai="center"
      gap="$2"
      pressStyle={{opacity: 0.7}}
      onPress={onPress}
    >
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
  )
}

export default SwitchTradePriceTypeButton

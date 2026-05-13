import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {ChevronDown, Typography} from '@vexl-next/ui'
import {useAtomValue, type Atom} from 'jotai'
import React from 'react'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {XStack, useTheme} from 'tamagui'
import {currencies} from '../utils/localization/currency'

interface Props extends TouchableOpacityProps {
  currencyAtom: Atom<CurrencyCode | undefined>
}

function CurrencySelectButton({
  currencyAtom,
  ...props
}: Props): React.ReactElement {
  const currency = useAtomValue(currencyAtom)
  const theme = useTheme()

  return (
    <TouchableOpacity activeOpacity={0.7} style={{width: 72}} {...props}>
      <XStack ai="center" gap="$2">
        <Typography variant="paragraphSmall" color="$foregroundPrimary">
          {currency ?? currencies.USD.code}
        </Typography>
        <ChevronDown color={theme.foregroundPrimary.get()} size={20} />
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrencySelectButton

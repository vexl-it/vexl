import {useAtomValue} from 'jotai'
import React from 'react'
import {styled, Text} from 'tamagui'
import {defaultCurrencyAtom} from '../../../../../utils/preferences'

export const ItemText = styled(Text, {
  fos: 18,
})

function SelectedCurrencyTitle(): React.ReactElement {
  const defaultCurrency = useAtomValue(defaultCurrencyAtom)
  return (
    <ItemText ff="$body500" col="$white">
      {defaultCurrency}
    </ItemText>
  )
}

export default SelectedCurrencyTitle

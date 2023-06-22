import {useAtomValue} from 'jotai'
import {selectedCurrencyAtom} from '../../../../../state/selectedCurrency'
import {styled, Text} from 'tamagui'

export const ItemText = styled(Text, {
  fos: 18,
})

function SelectedCurrencyTitle(): JSX.Element {
  const selectedCurrency = useAtomValue(selectedCurrencyAtom)
  return (
    <ItemText ff="$body500" col="$white">
      {selectedCurrency}
    </ItemText>
  )
}

export default SelectedCurrencyTitle

import {useAtomValue} from 'jotai'
import {styled, Text} from 'tamagui'
import {defaultCurrencyAtom} from '../../../../../utils/preferences'

export const ItemText = styled(Text, {
  fos: 18,
})

function SelectedCurrencyTitle(): JSX.Element {
  const defaultCurrency = useAtomValue(defaultCurrencyAtom)
  return (
    <ItemText ff="$body500" col="$white">
      {defaultCurrency}
    </ItemText>
  )
}

export default SelectedCurrencyTitle

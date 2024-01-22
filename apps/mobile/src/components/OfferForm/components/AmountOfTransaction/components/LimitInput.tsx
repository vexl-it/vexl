import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {useAtomValue, type PrimitiveAtom} from 'jotai'
import {type TextInputProps} from 'react-native'
import {
  getCurrencyLeftText,
  getCurrencyRightText,
} from '../../../../../utils/localization/currency'
import Input from '../../../../Input'
interface Props extends Omit<TextInputProps, 'style'> {
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
}

function LimitInput({currencyAtom, ...props}: Props): JSX.Element {
  const currency = useAtomValue(currencyAtom)
  return (
    <Input
      keyboardType="numeric"
      leftText={getCurrencyLeftText(currency)}
      rightText={getCurrencyRightText(currency)}
      variant="greyOnBlack"
      leftTextColor="$main"
      rightTextColor="$main"
      style={{f: 1}}
      {...props}
    />
  )
}

export default LimitInput

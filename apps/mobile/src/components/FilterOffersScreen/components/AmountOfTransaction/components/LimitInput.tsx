import Input from '../../../../Input'
import {type PrimitiveAtom, useAtomValue} from 'jotai'
import {type TextInputProps} from 'react-native'
import {type CurrencyCode} from '@vexl-next/domain/dist/general/offers'
import {getCurrencyLeftText, getCurrencyRightText} from '../../../../../utils/localization/currency'
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
      leftTextColor={'$main'}
      rightTextColor={'$main'}
      style={{f: 1}}
      {...props}
    />
  )
}

export default LimitInput

import Input from '../../../../Input'
import {type PrimitiveAtom, useAtomValue} from 'jotai'
import {type TextInputProps} from 'react-native'
import {type Currency} from '@vexl-next/domain/dist/general/offers'
interface Props extends Omit<TextInputProps, 'style'> {
  currencyAtom: PrimitiveAtom<Currency | undefined>
}

function LimitInput({currencyAtom, ...props}: Props): JSX.Element {
  const currency = useAtomValue(currencyAtom)
  return (
    <Input
      keyboardType="numeric"
      leftText={undefined}
      rightText={currency}
      variant="greyOnBlack"
      leftTextColor={'$main'}
      rightTextColor={'$main'}
      style={{f: 1}}
      {...props}
    />
  )
}

export default LimitInput

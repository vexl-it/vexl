import Input from '../../../../Input'
import {type SetStateAction} from 'react'
import {useAtomValue, type WritableAtom} from 'jotai'
import {type TextInputProps} from 'react-native'
import {type Currency} from '@vexl-next/domain/dist/general/offers'
interface Props extends Omit<TextInputProps, 'style'> {
  currencyAtom: WritableAtom<
    Currency | undefined,
    [SetStateAction<Currency>],
    void
  >
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

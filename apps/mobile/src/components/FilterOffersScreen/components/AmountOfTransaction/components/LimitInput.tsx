import Input from '../../../../Input'
import {useMemo} from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {type PrimitiveAtom, useAtomValue} from 'jotai'
import {type TextInputProps} from 'react-native'
import {type Currency} from '@vexl-next/domain/dist/general/offers'
interface Props extends Omit<TextInputProps, 'style'> {
  currencyAtom: PrimitiveAtom<Currency | undefined>
}

function LimitInput({currencyAtom, ...props}: Props): JSX.Element {
  const {t} = useTranslation()
  const currency = useAtomValue(currencyAtom)
  const currencySymbol = useMemo(
    () =>
      currency === 'USD'
        ? t('offerForm.amountOfTransaction.dollarSymbol')
        : currency === 'EUR'
        ? t('offerForm.amountOfTransaction.eurSymbol')
        : t('offerForm.amountOfTransaction.czkSymbol'),
    [currency, t]
  )
  return (
    <Input
      keyboardType="numeric"
      leftText={currency === 'USD' ? currencySymbol : undefined}
      rightText={currency !== 'USD' ? currencySymbol : undefined}
      variant="greyOnBlack"
      leftTextColor={'$main'}
      rightTextColor={'$main'}
      style={{f: 1}}
      {...props}
    />
  )
}

export default LimitInput

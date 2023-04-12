import Input from '../../../../Input'
import {useMemo} from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {currencyAtom} from '../../../state/atom'
import {type TextInputProps} from 'react-native'

function LimitInput(props: Omit<TextInputProps, 'style'>): JSX.Element {
  const {t} = useTranslation()
  const currency = useAtomValue(currencyAtom)
  const currencySymbol = useMemo(
    () =>
      currency === 'USD'
        ? t('createOffer.amountOfTransaction.dollarSymbol')
        : currency === 'EUR'
        ? t('createOffer.amountOfTransaction.eurSymbol')
        : t('createOffer.amountOfTransaction.czkSymbol'),
    [currency, t]
  )
  return (
    <Input
      keyboardType="numeric"
      leftText={currency === 'USD' ? currencySymbol : undefined}
      rightText={currency !== 'USD' ? currencySymbol : undefined}
      variant="greyOnBlack"
      style={{f: 1}}
      {...props}
    />
  )
}

export default LimitInput

import {useFocusEffect} from '@react-navigation/native'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Text} from 'tamagui'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../../PageWithNavigationHeader'
import {feeAmountAtom} from '../../../../../TradeCalculator/atoms'
import PremiumOrDiscount from '../../../../../TradeCalculator/components/PremiumOrDiscount'
import Content from '../../../Content'
import {applyFeeOnFeeChangeActionAtom, offerTypeAtom} from '../../atoms'

const tempFeeAmountAtom = atom<number>(0)

function PremiumOrDiscountScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  const offerType = useAtomValue(offerTypeAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const applyFeeOnFeeChange = useSetAtom(applyFeeOnFeeChangeActionAtom)
  const [tempFeeAmount, setTempFeeAmount] = useAtom(tempFeeAmountAtom)

  useFocusEffect(
    useCallback(() => {
      setTempFeeAmount(feeAmount)
    }, [feeAmount, setTempFeeAmount])
  )

  return (
    <>
      <HeaderProxy
        title={t('tradeChecklist.calculateAmount.premiumOrDiscount')}
      />
      <Content scrollable>
        <Text fos={16} mt="$2" mb="$4" col="$greyOnBlack">
          {offerType === 'BUY'
            ? t('offerForm.buyCheaperByUsingDiscount')
            : t('offerForm.sellFasterWithDiscount')}
        </Text>
        <PremiumOrDiscount
          offerTypeAtom={offerTypeAtom}
          tempFeeAmountAtom={tempFeeAmountAtom}
        />
      </Content>
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy
        onPress={() => {
          applyFeeOnFeeChange(tempFeeAmount)
          goBack()
        }}
        text={t('common.save')}
      />
    </>
  )
}

export default PremiumOrDiscountScreen

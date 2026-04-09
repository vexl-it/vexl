import {useFocusEffect} from '@react-navigation/native'
import {Typography} from '@vexl-next/ui'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {feeAmountAtom} from '../../../../../TradeCalculator/atoms'
import PremiumOrDiscount from '../../../../../TradeCalculator/components/PremiumOrDiscount'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {
  applyFeeOnFeeChangeActionAtom,
  isMineOfferAtom,
  offerTypeAtom,
} from '../../atoms'

const tempFeeAmountAtom = atom<number>(0)

function PremiumOrDiscountScreen(): React.ReactElement {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()

  const isMineOffer = useAtomValue(isMineOfferAtom)
  const offerType = useAtomValue(offerTypeAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const applyFeeOnFeeChange = useSetAtom(applyFeeOnFeeChangeActionAtom)
  const [tempFeeAmount, setTempFeeAmount] = useAtom(tempFeeAmountAtom)

  const iAmTheBuyer =
    (offerType === 'BUY' && isMineOffer) ||
    (offerType === 'SELL' && !isMineOffer)

  useFocusEffect(
    useCallback(() => {
      setTempFeeAmount(feeAmount)
    }, [feeAmount, setTempFeeAmount])
  )

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.calculateAmount.premiumOrDiscount'),
      }}
      bottomButton={{
        onPress: () => {
          applyFeeOnFeeChange(tempFeeAmount)
          goBack()
        },
        text: t('common.save'),
        disabled: false,
        variant: 'secondary',
      }}
    >
      <Typography
        variant="paragraphSmall"
        color="$foregroundSecondary"
        mt="$2"
        mb="$4"
      >
        {iAmTheBuyer
          ? t('offerForm.buyCheaperByUsingDiscount')
          : t('offerForm.sellFasterWithDiscount')}
      </Typography>
      <PremiumOrDiscount
        iAmTheBuyer={iAmTheBuyer}
        tempFeeAmountAtom={tempFeeAmountAtom}
      />
    </TradeChecklistItemPageLayout>
  )
}

export default PremiumOrDiscountScreen

import {useFocusEffect} from '@react-navigation/native'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {ScrollView} from 'react-native'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import OfferTypeSection from '../../../OfferForm/components/OfferType'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../PageWithNavigationHeader'
import {
  applyFeeOnFeeChangeActionAtom,
  feeAmountAtom,
} from '../../../TradeCalculator/atoms'
import PremiumOrDiscount from '../../../TradeCalculator/components/PremiumOrDiscount'
import {listingTypeAtom, offerTypeAtom} from '../../atoms'

const tempFeeAmountAtom = atom<number>(0)

function PremiumOrDiscountScreen(): React.ReactElement {
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
      <Stack f={1} bc="$black" pb="$1">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Stack pt="$4" gap="$4">
            <OfferTypeSection
              listingTypeAtom={listingTypeAtom}
              offerTypeAtom={offerTypeAtom}
            />
            <PremiumOrDiscount
              iAmTheBuyer={offerType === 'BUY'}
              tempFeeAmountAtom={tempFeeAmountAtom}
            />
          </Stack>
        </ScrollView>
      </Stack>
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

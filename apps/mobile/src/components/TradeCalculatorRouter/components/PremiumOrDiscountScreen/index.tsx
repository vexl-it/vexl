import {useFocusEffect} from '@react-navigation/native'
import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {
  Button,
  NavigationBar,
  Screen,
  SegmentedPicker,
  useScreenFooterHeight,
} from '@vexl-next/ui'
import {XmarkCancelClose} from '@vexl-next/ui/src/icons'
import {ScrollView, YStack} from '@vexl-next/ui/src/primitives'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../utils/localization/currency'
import {formatDecimal} from '../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../utils/localization/formattingLocaleAtom'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import PremiumOrDiscountSlider from '../../../PremiumOrDiscountSlider'
import {
  applyFeeOnFeeChangeActionAtom,
  btcPriceCurrencyAtom,
  feeAmountAtom,
  fiatValueNumberAtom,
} from '../../../TradeCalculator/atoms'
import {applyFee, cancelFee} from '../../../TradeCalculator/helpers'
import {offerTypeAtom} from '../../atoms'

const tempFeeAmountAtom = atom<number>(0)

function useOfferTypeTabs(): ReadonlyArray<{
  readonly label: string
  readonly value: OfferType
}> {
  const {t} = useTranslation()
  return [
    {label: t('offerForm.sellBitcoin'), value: 'SELL'},
    {label: t('offerForm.buyBitcoin'), value: 'BUY'},
  ]
}

function PremiumOrDiscountScreen(): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const goBack = useSafeGoBack()
  const {footerHeightAtom} = useScreenFooterHeight()

  const offerType = useAtomValue(offerTypeAtom)
  const setOfferType = useSetAtom(offerTypeAtom)
  const feeAmount = useAtomValue(feeAmountAtom)
  const fiatValueNumber = useAtomValue(fiatValueNumberAtom)
  const footerHeight = useAtomValue(footerHeightAtom)
  const fiatCurrency = useAtomValue(btcPriceCurrencyAtom)
  const applyFeeOnFeeChange = useSetAtom(applyFeeOnFeeChangeActionAtom)
  const [tempFeeAmount, setTempFeeAmount] = useAtom(tempFeeAmountAtom)
  const tabs = useOfferTypeTabs()
  const isBuy = offerType === 'BUY'

  const amountText = useMemo(() => {
    if (fiatValueNumber === 0) return ''

    const currency = fiatCurrency ?? 'USD'
    const amountWithoutFee = cancelFee(fiatValueNumber, feeAmount)
    const amountWithTempFee = applyFee(amountWithoutFee, tempFeeAmount)
    const formattedAmount = formatDecimal(
      Math.round(amountWithTempFee),
      locale,
      {
        maximumFractionDigits: 0,
      }
    )
    const amount = `${formattedAmount} ${currencies[currency].code}`

    return isBuy
      ? t('offerForm.premiumOrDiscount.youllPayAround', {amount})
      : t('offerForm.premiumOrDiscount.youllGetAround', {amount})
  }, [
    feeAmount,
    fiatCurrency,
    fiatValueNumber,
    isBuy,
    locale,
    t,
    tempFeeAmount,
  ])

  useFocusEffect(
    useCallback(() => {
      setTempFeeAmount(feeAmount)
    }, [feeAmount, setTempFeeAmount])
  )

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('tradeChecklist.calculateAmount.premiumOrDiscount')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: goBack,
              variant: 'normal',
            },
          ]}
        />
      }
      footer={
        <Button
          onPress={() => {
            applyFeeOnFeeChange(tempFeeAmount)
            goBack()
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <ScrollView
        f={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: footerHeight}}
      >
        <YStack gap="$7">
          <SegmentedPicker
            tabs={tabs}
            activeTab={offerType ?? 'SELL'}
            onTabPress={setOfferType}
          />

          <PremiumOrDiscountSlider
            feeAmount={tempFeeAmount}
            onFeeAmountChange={setTempFeeAmount}
            isBuy={isBuy}
            amountText={amountText}
          />
        </YStack>
      </ScrollView>
    </Screen>
  )
}

export default PremiumOrDiscountScreen

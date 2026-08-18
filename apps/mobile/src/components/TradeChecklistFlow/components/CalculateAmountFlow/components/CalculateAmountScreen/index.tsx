import {InfoBox} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo} from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import calculatePercentageDifference from '../../../../../../utils/calculatePercentageDifference'
import {dismissKeyboardAndResolveOnLayoutUpdate} from '../../../../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import {formatDecimal} from '../../../../../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../../../../../utils/localization/formattingLocaleAtom'
import {
  btcPriceForOfferWithStateAtom,
  tradePriceTypeAtom,
} from '../../../../../TradeCalculator/atoms'
import TradeCalculator from '../../../../../TradeCalculator/components/TradeCalculator'
import {useTradeChecklistExitNavigation} from '../../../../useTradeChecklistExitNavigation'
import {TradeChecklistItemPageLayout} from '../../../TradeChecklistItemPageLayout'
import {
  isOtherSideAmountDataNewerThanMineAtom,
  saveButtonDisabledAtom,
  saveLocalCalculatedAmountDataStateToMainStateActionAtom,
  syncDataWithChatStateActionAtom,
} from '../../atoms'

type Props = TradeChecklistStackScreenProps<'CalculateAmount'>

function CalculateAmountScreen({
  navigation,
  route: {
    params: {amountData},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)

  const isOtherSideAmountDataNewerThanMine = useAtomValue(
    isOtherSideAmountDataNewerThanMineAtom
  )
  const saveButtonDisabled = useAtomValue(saveButtonDisabledAtom)
  const tradePriceType = useAtomValue(tradePriceTypeAtom)

  const tradeChecklistExitNavigation = useTradeChecklistExitNavigation()
  const syncDataWithChatState = useSetAtom(syncDataWithChatStateActionAtom)
  const saveLocalCalculatedAmountDataStateToMainState = useSetAtom(
    saveLocalCalculatedAmountDataStateToMainStateActionAtom
  )
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)

  const btcPricePercentageDifference = useMemo(() => {
    if (tradePriceType === 'custom' && amountData?.btcPrice)
      return calculatePercentageDifference(
        amountData.btcPrice,
        btcPriceForOfferWithState?.btcPrice?.BTC
      )

    return 0
  }, [amountData?.btcPrice, btcPriceForOfferWithState, tradePriceType])

  const onFooterButtonPress = useCallback(() => {
    void dismissKeyboardAndResolveOnLayoutUpdate().then(() => {
      void saveLocalCalculatedAmountDataStateToMainState()().then((success) => {
        if (success) {
          tradeChecklistExitNavigation()
        }
      })
    })
  }, [
    saveLocalCalculatedAmountDataStateToMainState,
    tradeChecklistExitNavigation,
  ])

  useEffect(() => {
    void syncDataWithChatState(amountData)
  }, [amountData, syncDataWithChatState])

  return (
    <TradeChecklistItemPageLayout
      header={{
        title: t('tradeChecklist.calculateAmount.suggestAmount'),
      }}
      bottomButton={{
        disabled: saveButtonDisabled,
        onPress: onFooterButtonPress,
        text: isOtherSideAmountDataNewerThanMine
          ? t('common.accept')
          : t('common.save'),
        variant: isOtherSideAmountDataNewerThanMine ? 'secondary' : 'primary',
      }}
    >
      <TradeCalculator
        onPremiumOrDiscountPress={() => {
          navigation.navigate('PremiumOrDiscount')
        }}
      >
        <InfoBox variant="default">
          {`${t(
            'tradeChecklist.calculateAmount.choseToCalculateWithCustomPrice',
            {
              username: t('common.otherSide'),
              percentage: formatDecimal(
                Math.abs(btcPricePercentageDifference),
                locale
              ),
            }
          )} ${
            btcPricePercentageDifference >= 0
              ? t('vexlbot.higherThanLivePrice')
              : t('vexlbot.lowerThanLivePrice')
          }`}
        </InfoBox>
      </TradeCalculator>
    </TradeChecklistItemPageLayout>
  )
}

export default CalculateAmountScreen

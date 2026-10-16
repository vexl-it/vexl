import {TradePriceTypeButton} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {tradePriceTypeAtom} from '../../../atoms'

function SwitchTradePriceTypeButton({
  onPress,
}: {
  readonly onPress: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const tradePriceType = useAtomValue(tradePriceTypeAtom) ?? 'live'

  return (
    <TradePriceTypeButton
      priceType={tradePriceType}
      label={
        tradePriceType === 'live'
          ? t('tradeCalculator.liveMarketPrice')
          : tradePriceType === 'frozen'
            ? t('tradeChecklist.calculateAmount.frozenPrice')
            : tradePriceType === 'custom'
              ? t('tradeChecklist.calculateAmount.customPrice')
              : t('tradeChecklist.calculateAmount.yourPrice')
      }
      onPress={onPress}
    />
  )
}

export default SwitchTradePriceTypeButton

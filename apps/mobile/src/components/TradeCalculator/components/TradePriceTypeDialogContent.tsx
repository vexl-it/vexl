import {type TradePriceType} from '@vexl-next/domain/src/general/tradeChecklist'
import {Divider, SelectableItem, YStack} from '@vexl-next/ui'
import {useAtom, type PrimitiveAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'

export type SelectableTradePriceType = Extract<
  TradePriceType,
  'live' | 'frozen' | 'your'
>

interface Props {
  readonly selectedTradePriceTypeAtom: PrimitiveAtom<SelectableTradePriceType>
}

function TradePriceTypeDialogContent({
  selectedTradePriceTypeAtom,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const [selectedTradePriceType, setSelectedTradePriceType] = useAtom(
    selectedTradePriceTypeAtom
  )

  return (
    <YStack gap="$1">
      <SelectableItem
        label={t('tradeCalculator.liveMarketPrice')}
        selected={selectedTradePriceType === 'live'}
        onPress={() => {
          setSelectedTradePriceType('live')
        }}
      />
      <Divider />
      <SelectableItem
        label={t('tradeCalculator.freezeCurrentMarketPrice')}
        selected={selectedTradePriceType === 'frozen'}
        onPress={() => {
          setSelectedTradePriceType('frozen')
        }}
      />
      <Divider />
      <SelectableItem
        label={t('tradeChecklist.calculateAmount.setYourOwnPrice')}
        selected={selectedTradePriceType === 'your'}
        onPress={() => {
          setSelectedTradePriceType('your')
        }}
      />
    </YStack>
  )
}

export default TradePriceTypeDialogContent

import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {Loader, Typography} from '@vexl-next/ui'
import {XStack} from '@vexl-next/ui/src/primitives'
import React from 'react'
import {formatBtcPrice, formatBtcPriceUpdatedAt} from '../utils/formatBtcPrice'
import {useTranslation} from '../utils/localization/I18nProvider'

interface BtcPriceInfoProps {
  readonly btcPriceData: BtcPriceDataWithState | undefined
  readonly currency: CurrencyCode
}

function BtcPriceInfo({
  btcPriceData,
  currency,
}: BtcPriceInfoProps): React.ReactElement {
  const {t} = useTranslation()
  const formattedPrice = formatBtcPrice(btcPriceData, currency)
  const updatedAt = formatBtcPriceUpdatedAt(btcPriceData)

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      padding="$4"
      gap="$2"
    >
      <XStack alignItems="center" gap="$2">
        <Typography variant="paragraphSmallBold" color="$foregroundSecondary">
          {formattedPrice
            ? t('filterOffers.btcPrice', {price: formattedPrice})
            : '1 BTC ='}
        </Typography>
        {!formattedPrice ? <Loader size="small" /> : null}
      </XStack>
      <XStack alignItems="center" gap="$2">
        <Typography variant="micro" color="$foregroundSecondary">
          {updatedAt
            ? t('filterOffers.btcPriceUpdatedAt', {date: updatedAt})
            : t('filterOffers.btcPriceUpdatedAt', {date: ''})}
        </Typography>
        {!updatedAt ? <Loader size="small" /> : null}
      </XStack>
    </XStack>
  )
}

export default BtcPriceInfo

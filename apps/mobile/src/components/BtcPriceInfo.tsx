import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {PriceStatusRow} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {formatBtcPrice, formatBtcPriceUpdatedAt} from '../utils/formatBtcPrice'
import {useTranslation} from '../utils/localization/I18nProvider'
import {formattingLocaleAtom} from '../utils/localization/formattingLocaleAtom'

interface BtcPriceInfoProps {
  readonly btcPriceData: BtcPriceDataWithState | undefined
  readonly currency: CurrencyCode
  readonly isRefreshing?: boolean
  readonly onRetry?: () => void
  readonly showRetry?: boolean
}

function BtcPriceInfo({
  btcPriceData,
  currency,
  isRefreshing,
  onRetry,
  showRetry: showRetryProp,
}: BtcPriceInfoProps): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const formattedPrice = formatBtcPrice(btcPriceData, currency, locale)
  const updatedAt = formatBtcPriceUpdatedAt(btcPriceData, locale)
  const isLoading = isRefreshing ?? btcPriceData?.state === 'loading'
  const showRetry =
    !!onRetry &&
    !isLoading &&
    (showRetryProp ?? btcPriceData?.state === 'error')
  const headline = formattedPrice
    ? t('filterOffers.btcPrice', {price: formattedPrice})
    : showRetry
      ? t('offerForm.exchangeRateUnavailable')
      : '1 BTC ='

  return (
    <PriceStatusRow
      headline={headline}
      loading={isLoading}
      trailingText={
        updatedAt
          ? t('filterOffers.btcPriceUpdatedAt', {date: updatedAt})
          : undefined
      }
      retryLabel={t('common.tryAgain')}
      onRetry={showRetry ? onRetry : undefined}
    />
  )
}

export default BtcPriceInfo

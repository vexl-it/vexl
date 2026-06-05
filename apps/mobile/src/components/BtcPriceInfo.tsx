import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {Button, Loader, Typography} from '@vexl-next/ui'
import {XStack} from '@vexl-next/ui/src/primitives'
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
    <XStack
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      padding="$4"
      gap="$2"
    >
      <XStack alignItems="center" gap="$2">
        <Typography variant="paragraphSmallBold" color="$foregroundSecondary">
          {headline}
        </Typography>
        {!formattedPrice && isLoading ? <Loader size="small" /> : null}
      </XStack>
      <XStack alignItems="center" gap="$2">
        {showRetry ? (
          <Button
            variant="secondary"
            size="small"
            onPress={() => {
              onRetry?.()
            }}
          >
            {t('common.tryAgain')}
          </Button>
        ) : isLoading ? (
          <Loader size="small" />
        ) : updatedAt ? (
          <Typography variant="micro" color="$foregroundSecondary">
            {t('filterOffers.btcPriceUpdatedAt', {date: updatedAt})}
          </Typography>
        ) : null}
      </XStack>
    </XStack>
  )
}

export default BtcPriceInfo

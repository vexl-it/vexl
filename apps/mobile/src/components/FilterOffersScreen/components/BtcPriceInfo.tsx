import {Loader, Typography} from '@vexl-next/ui'
import {XStack} from '@vexl-next/ui/src/primitives'
import {Option, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import {DateTime} from 'luxon'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {currencies} from '../../../utils/localization/currency'
import {btcPriceForFilterCurrencyAtom, currencyAtom} from '../atom'

function BtcPriceInfo(): React.ReactElement | null {
  const {t} = useTranslation()
  const btcPriceData = useAtomValue(btcPriceForFilterCurrencyAtom)
  const currency = useAtomValue(currencyAtom)

  if (!currency) return null

  const btcPrice = btcPriceData?.btcPrice
  const formattedPrice = btcPrice
    ? Intl.NumberFormat().format(Math.round(btcPrice.BTC))
    : undefined

  const updatedAt = pipe(
    btcPrice?.lastUpdatedAt ?? Option.none(),
    Option.match({
      onNone: () => undefined,
      onSome: (value) =>
        DateTime.fromMillis(value).toLocaleString(DateTime.DATETIME_MED),
    })
  )

  return (
    <XStack alignItems="center" justifyContent="space-between" padding="$4">
      <XStack alignItems="center" gap="$2">
        <Typography variant="paragraphSmallBold" color="$foregroundSecondary">
          {formattedPrice
            ? t('filterOffers.btcPrice', {
                price: `${formattedPrice} ${currencies[currency].symbol}`,
              })
            : `1 BTC =`}
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

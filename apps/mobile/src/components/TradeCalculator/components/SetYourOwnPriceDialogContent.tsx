import {Exchange} from '@vexl-next/ui'
import {useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {getCurrentLocale} from '../../../utils/localization/I18nProvider'
import {btcPriceForOfferWithStateAtom, ownPriceAtom} from '../atoms'
import {normalizeInputString} from '../helpers'

interface Props {
  readonly fiatCurrency: string
}

function SetYourOwnPriceDialogContent({
  fiatCurrency,
}: Props): React.ReactElement {
  const locale = getCurrentLocale()
  const btcPriceForOfferWithState = useAtomValue(btcPriceForOfferWithStateAtom)
  const [ownPrice, setOwnPrice] = useAtom(ownPriceAtom)

  const fiatPlaceholder =
    btcPriceForOfferWithState?.state === 'success'
      ? btcPriceForOfferWithState.btcPrice.BTC.toLocaleString(locale, {
          maximumFractionDigits: 0,
        })
      : '-'

  return (
    <Exchange
      btcValue="1"
      btcUnit="BTC"
      btcEditable={false}
      onBtcUnitChange={() => {}}
      fiatValue={ownPrice ?? ''}
      fiatCurrency={fiatCurrency ?? 'USD'}
      fiatPlaceholder={fiatPlaceholder}
      fiatLoading={btcPriceForOfferWithState?.state === 'loading'}
      fiatAutoFocus
      fiatCurrencyEditable={false}
      onFiatCurrencyPress={() => {}}
      onFiatValueChange={(input) => {
        setOwnPrice(normalizeInputString(input))
      }}
      locale={locale}
    />
  )
}

export default SetYourOwnPriceDialogContent

import {BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {
  type CurrencyCode,
  CurrencyCodeE,
} from '@vexl-next/domain/src/general/currency.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Schema} from 'effect'
import {atom, type Atom, type PrimitiveAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {apiAtom} from '../api'
import {atomWithParsedMmkvStorageE} from '../utils/atomUtils/atomWithParsedMmkvStorageE'
import {currencies} from '../utils/localization/currency'
import {defaultCurrencyAtom} from '../utils/preferences'
import reportError from '../utils/reportError'

export const SATOSHIS_IN_BTC = 100_000_000
export const DECIMALS_FOR_BTC_VALUE = 8

const FETCH_LIMIT = 10 * 60 * 1000 // 10 minutes

const PriceDataStored = Schema.Struct({
  data: Schema.partial(
    Schema.Record({key: CurrencyCodeE, value: BtcPriceDataWithState})
  ),
})
type PriceDataStored = typeof PriceDataStored.Type

const btcPriceMmkvAtom = atomWithParsedMmkvStorageE(
  'brcPrice',
  {data: {} as Record<CurrencyCode, BtcPriceDataWithState>},
  PriceDataStored
)

export const btcPriceDataAtom: PrimitiveAtom<
  Partial<Record<CurrencyCode, BtcPriceDataWithState>>
> = focusAtom(btcPriceMmkvAtom, (p) => p.prop('data'))

export function createBtcPriceForCurrencyAtom(
  currencyStringOrAtom: CurrencyCode | Atom<CurrencyCode | undefined>
): Atom<BtcPriceDataWithState | undefined> {
  return atom((get): BtcPriceDataWithState | undefined => {
    const btcPriceData = get(btcPriceDataAtom)

    const currency = (() => {
      if (typeof currencyStringOrAtom === 'string') {
        return currencyStringOrAtom
      } else {
        return get(currencyStringOrAtom)
      }
    })()

    if (!currency) {
      return undefined
    }

    return btcPriceData[currency]
  })
}

export const btcPriceForSelectedCurrencyAtom =
  createBtcPriceForCurrencyAtom(defaultCurrencyAtom)

export const refreshBtcPriceActionAtom = atom(
  undefined,
  (
    get,
    set,
    currencyStringOrAtom: CurrencyCode | Atom<CurrencyCode | undefined>
  ) => {
    const api = get(apiAtom)
    const currency =
      (typeof currencyStringOrAtom === 'string'
        ? currencyStringOrAtom
        : get(currencyStringOrAtom)) ?? currencies.USD.code

    // TODO this can be done statically in constant. Should not be parsed every time.

    const fetchInfo = get(btcPriceDataAtom)[currency]
    if (
      fetchInfo?.state === 'success' &&
      fetchInfo.lastRefreshAt + FETCH_LIMIT > unixMillisecondsNow()
    ) {
      return Effect.succeed(true)
    }

    set(btcPriceDataAtom, (prevState) => ({
      ...prevState,
      [currency]: {
        state: 'loading',
        btcPrice: prevState[currency]?.btcPrice ?? undefined,
      } satisfies BtcPriceDataWithState,
    }))

    return api.btcExchangeRate.getExchangeRate({query: {currency}}).pipe(
      Effect.match({
        onFailure: (l) => {
          reportError('warn', new Error('Error while fetching btc price'), {
            l,
          })

          set(btcPriceDataAtom, (prevState) => ({
            ...prevState,
            [currency]: {
              btcPrice: prevState[currency]?.btcPrice,
              state: 'error',
              error: l,
            },
          }))

          return false
        },
        onSuccess: (btcPrice) => {
          set(btcPriceDataAtom, (prevState) => ({
            ...prevState,
            [currency]: {
              btcPrice: {...btcPrice, BTC: btcPrice.BTC},
              state: 'success',
              lastRefreshAt: unixMillisecondsNow(),
            } satisfies BtcPriceDataWithState,
          }))

          return true
        },
      })
    )
  }
)

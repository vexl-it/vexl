import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {AcceptedCurrency} from '@vexl-next/rest-api/src/services/btcPrice'
import {pipe} from 'fp-ts/function'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {atom, type Atom, type PrimitiveAtom} from 'jotai'
import {publicApiAtom} from '../api'
import reportError from '../utils/reportError'
import {selectedCurrencyAtom} from './selectedCurrency'

const FETCH_LIMIT = 10 * 60 * 1000 // 10 minutes

export const btcPriceDataAtom: PrimitiveAtom<
  Partial<Record<CurrencyCode, BtcPriceDataWithState>>
> = atom({})

export function createBtcPriceForCurrencyAtom(
  currencyStringOrAtom: CurrencyCode | Atom<CurrencyCode | undefined>
): Atom<BtcPriceDataWithState | undefined> {
  return atom((get): BtcPriceDataWithState | undefined => {
    const btcPriceData = get(btcPriceDataAtom)

    const currency = (() => {
      if (typeof currencyStringOrAtom === 'string') return currencyStringOrAtom
      return get(currencyStringOrAtom)
    })()

    if (!currency) {
      return undefined
    }

    return btcPriceData[currency]
  })
}

export const btcPriceForSelectedCurrencyAtom =
  createBtcPriceForCurrencyAtom(selectedCurrencyAtom)

export const refreshBtcPriceActionAtom = atom(
  undefined,
  (get, set, currency: CurrencyCode) => {
    const api = get(publicApiAtom)

    // TODO this can be done statically in constant. Should not be parsed every time.
    const acceptedCurrency = AcceptedCurrency.safeParse(currency.toLowerCase())
    if (!acceptedCurrency.success) return T.of(false)

    const fetchInfo = get(btcPriceDataAtom)[currency]
    if (
      fetchInfo?.state === 'success' &&
      fetchInfo.lastRefreshAt + FETCH_LIMIT > unixMillisecondsNow()
    ) {
      return T.of(true)
    }

    set(btcPriceDataAtom, (prevState) => ({
      ...prevState,
      [currency]: {
        state: 'loading',
        btcPrice: prevState[currency]?.btcPrice ?? undefined,
      } satisfies BtcPriceDataWithState,
    }))

    return pipe(
      api.btcPrice(acceptedCurrency.data),
      TE.matchW(
        (l) => {
          reportError('warn', new Error('Error while fetching btc price'), {
            l,
          })

          set(btcPriceDataAtom, (prevState) => ({
            ...prevState,
            [currency]: {
              btcPrice: prevState[currency]?.btcPrice ?? 0,
              state: 'error',
              error: l,
            },
          }))

          return false
        },
        (btcPrice) => {
          set(btcPriceDataAtom, (prevState) => ({
            ...prevState,
            [currency]: {
              btcPrice,
              state: 'success',
              lastRefreshAt: unixMillisecondsNow(),
            } satisfies BtcPriceDataWithState,
          }))

          return true
        }
      )
    )
  }
)

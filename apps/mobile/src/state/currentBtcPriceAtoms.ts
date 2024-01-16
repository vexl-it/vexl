import {type Atom, atom, type PrimitiveAtom} from 'jotai'
import {publicApiAtom} from '../api'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {toCommonErrorMessage} from '../utils/useCommonErrorMessages'
import {translationAtom} from '../utils/localization/I18nProvider'
import reportError from '../utils/reportError'
import showErrorAlert from '../utils/showErrorAlert'
import {AcceptedCurrency} from '@vexl-next/rest-api/src/services/btcPrice'
import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {selectedCurrencyAtom} from './selectedCurrency'

const BULGARIAN_LEV_PEGGED_EURO_RATE = 1.95583

const dummyBtcPriceDataState: Record<string, BtcPriceDataWithState> = {
  [CurrencyCode.parse('USD')]: {
    btcPrice: 0,
    state: 'error',
  },
}

export const btcPriceDataAtom: PrimitiveAtom<
  Record<string, BtcPriceDataWithState>
> = atom(dummyBtcPriceDataState)

export const btcPriceForSelectedCurrencyAtom: Atom<BtcPriceDataWithState> =
  atom((get) => {
    const selectedCurrency = get(selectedCurrencyAtom)
    const btcPriceData = get(btcPriceDataAtom)

    return (
      btcPriceData[selectedCurrency] ??
      ({btcPrice: 0, state: 'error'} satisfies BtcPriceDataWithState)
    )
  })

export const refreshBtcPriceActionAtom = atom(
  undefined,
  (get, set, currency: CurrencyCode) => {
    const api = get(publicApiAtom)
    const {t} = get(translationAtom)

    // Bulgarian LEV is pegged to Euro and as CoinGecko does not support it
    // we calculate it manually from EUR price
    const acceptedCurrency =
      currency === 'BGN'
        ? AcceptedCurrency.safeParse('EUR'.toLowerCase())
        : AcceptedCurrency.safeParse(currency.toLowerCase())

    if (!acceptedCurrency.success) return T.of(false)

    set(btcPriceDataAtom, (prevState) => ({
      ...prevState,
      [currency]: {
        btcPrice: prevState[currency]?.btcPrice ?? 0,
        state: 'loading',
      },
    }))

    return pipe(
      api.btcPrice(acceptedCurrency.data),
      TE.matchW(
        (l) => {
          showErrorAlert({
            title:
              toCommonErrorMessage(l, t) ??
              t('btcPriceChart.requestCouldNotBeProcessed'),
            error: l,
          })
          reportError('warn', 'Error while fetching btc price', l)

          set(btcPriceDataAtom, (prevState) => ({
            ...prevState,
            [currency]: {
              btcPrice: prevState[currency]?.btcPrice ?? 0,
              state: 'error',
            },
          }))

          return false
        },
        (btcPrice) => {
          if (currency === 'BGN') {
            set(btcPriceDataAtom, (prevState) => ({
              ...prevState,
              [currency]: {
                btcPrice: Math.round(btcPrice * BULGARIAN_LEV_PEGGED_EURO_RATE),
                state: 'success',
              },
            }))
          } else {
            set(btcPriceDataAtom, (prevState) => ({
              ...prevState,
              [currency]: {
                btcPrice,
                state: 'success',
              },
            }))
          }

          return true
        }
      )
    )
  }
)

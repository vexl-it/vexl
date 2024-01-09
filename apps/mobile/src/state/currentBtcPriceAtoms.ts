import {atom} from 'jotai'
import {privateApiAtom, publicApiAtom} from '../api'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {toCommonErrorMessage} from '../utils/useCommonErrorMessages'
import {translationAtom} from '../utils/localization/I18nProvider'
import {type Task} from 'fp-ts/Task'
import reportError from '../utils/reportError'
import {type GetCryptocurrencyDetailsResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import showErrorAlert from '../utils/showErrorAlert'
import {
  type UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {AcceptedCurrency} from '@vexl-next/rest-api/src/services/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'

const BTC_PRICE_UPDATE_TRIGGER_THRESHOLD_MILLISECONDS = 900000

const btcPriceLastUpdateAtAtom = atom<UnixMilliseconds>(UnixMilliseconds0)

// TODO change type to number and use new api: api.btcPrice(currency)
export const btcPriceAtom = atom<GetCryptocurrencyDetailsResponse | undefined>(
  undefined
)

export const currentBtcPriceAtom = atom<number | undefined>(undefined)

export const fetchBtcPriceActionAtom = atom(
  undefined,
  (get, set, currency: CurrencyCode) => {
    const api = get(publicApiAtom)
    const {t} = get(translationAtom)

    const acceptedCurrency = AcceptedCurrency.safeParse(currency.toLowerCase())

    if (!acceptedCurrency.success) return T.of(false)

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
          return false
        },
        (btcPrice) => {
          set(currentBtcPriceAtom, btcPrice)
          return true
        }
      )
    )
  }
)

// TODO change to use new api: api.btcPrice(currency)
export const refreshBtcPriceActionAtom = atom<undefined, [], Task<boolean>>(
  undefined,
  (get, set) => {
    const api = get(privateApiAtom)
    const {t} = get(translationAtom)
    const btcPriceLastUpdateAt = get(btcPriceLastUpdateAtAtom)
    const timeDifferenceSinceLastUpdate = Date.now() - btcPriceLastUpdateAt

    if (
      timeDifferenceSinceLastUpdate <
      BTC_PRICE_UPDATE_TRIGGER_THRESHOLD_MILLISECONDS
    )
      return T.of(true)

    return pipe(
      api.user.getCryptocurrencyDetails({coin: 'bitcoin'}),
      TE.matchW(
        (l) => {
          showErrorAlert({
            title:
              toCommonErrorMessage(l, t) ??
              t('btcPriceChart.requestCouldNotBeProcessed'),
            error: l,
          })
          reportError('warn', 'Error while fetching btc price', l)
          return false
        },
        (r) => {
          set(btcPriceLastUpdateAtAtom, unixMillisecondsNow())
          set(btcPriceAtom, r)
          return true
        }
      )
    )
  }
)

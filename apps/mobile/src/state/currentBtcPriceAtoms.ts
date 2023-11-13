import {atom} from 'jotai'
import {privateApiAtom} from '../api'
import * as TE from 'fp-ts/TaskEither'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {toCommonErrorMessage} from '../utils/useCommonErrorMessages'
import {translationAtom} from '../utils/localization/I18nProvider'
import {type Task} from 'fp-ts/Task'
import reportError from '../utils/reportError'
import {type GetCryptocurrencyDetailsResponse} from '@vexl-next/rest-api/dist/services/user/contracts'
import showErrorAlert from '../utils/showErrorAlert'
import {
  type UnixMilliseconds,
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'

const BTC_PRICE_UPDATE_TRIGGER_THRESHOLD_MILLISECONDS = 900000

const btcPriceLastUpdateAtAtom = atom<UnixMilliseconds>(UnixMilliseconds0)

export const btcPriceAtom = atom<GetCryptocurrencyDetailsResponse | undefined>(
  undefined
)

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

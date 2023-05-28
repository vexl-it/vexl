import {atom} from 'jotai'
import {privateApiAtom} from '../../api'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {toCommonErrorMessage} from '../../utils/useCommonErrorMessages'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {Alert} from 'react-native'
import {type Task} from 'fp-ts/Task'
import reportError from '../../utils/reportError'
import {type GetCryptocurrencyDetailsResponse} from '@vexl-next/rest-api/dist/services/user/contracts'

export const btcPriceAtom = atom<GetCryptocurrencyDetailsResponse | undefined>(
  undefined
)

export const refreshBtcPriceActionAtom = atom<undefined, [], Task<boolean>>(
  undefined,
  (get, set) => {
    const api = get(privateApiAtom)
    const {t} = get(translationAtom)
    return pipe(
      api.user.getCryptocurrencyDetails({coin: 'bitcoin'}),
      TE.matchW(
        (l) => {
          Alert.alert(
            toCommonErrorMessage(l, t) ??
              t('btcPriceChart.requestCouldNotBeProcessed')
          )
          reportError('warn', 'Error while fetching btc price', l)
          return false
        },
        (r) => {
          set(btcPriceAtom, r)
          return true
        }
      )
    )
  }
)

import {BtcPrice} from '@vexl-next/domain/src/general/btcPrice'
import {
  safeParse,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import z from 'zod'
import {
  type BadStatusCodeError,
  type NetworkError,
  type UnexpectedApiResponseError,
  type UnknownError,
} from '../Errors'
import {type PlatformName} from '../PlatformName'
import {
  axiosCallWithValidation,
  createAxiosInstance,
  type LoggingFunction,
} from '../utils'

const BULGARIAN_LEV_PEGGED_EURO_RATE = 1.95583

// List of currencies can be found here: https://cdn.trezor.io/dynamic/coingecko/api/v3/simple/supported_vs_currencies

const URL_TEMPLATE =
  'https://cdn.trezor.io/dynamic/coingecko/api/v3/simple/price?ids=bitcoin&vs_currencies='

export const AcceptedCurrency = z.enum([
  'btc',
  'eth',
  'ltc',
  'bch',
  'bnb',
  'eos',
  'xrp',
  'xlm',
  'link',
  'dot',
  'yfi',
  'usd',
  'aed',
  'ars',
  'aud',
  'bdt',
  'bhd',
  'bmd',
  'brl',
  'cad',
  'chf',
  'clp',
  'cny',
  'czk',
  'dkk',
  'eur',
  'gbp',
  'hkd',
  'huf',
  'idr',
  'ils',
  'inr',
  'jpy',
  'krw',
  'kwd',
  'lkr',
  'mmk',
  'mxn',
  'myr',
  'ngn',
  'nok',
  'nzd',
  'php',
  'pkr',
  'pln',
  'rub',
  'sar',
  'sek',
  'sgd',
  'thb',
  'try',
  'twd',
  'uah',
  'vef',
  'vnd',
  'zar',
  'xdr',
  'xag',
  'xau',
  'bits',
  'sats',
  'bgn',
])

export type AcceptedCurrency = z.TypeOf<typeof AcceptedCurrency>

export function createBtcPriceApi({
  platform,
  clientVersion,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: number
  loggingFunction?: LoggingFunction | null
}): (
  currency: AcceptedCurrency
) => TE.TaskEither<
  | UnknownError
  | BadStatusCodeError
  | UnexpectedApiResponseError
  | NetworkError
  | ZodParseError<BtcPrice>,
  number
> {
  const axiosInstance = createAxiosInstance(
    platform,
    clientVersion,
    undefined,
    loggingFunction
  )

  return function getBtcPrice(
    currency: AcceptedCurrency
  ): TE.TaskEither<
    | UnknownError
    | BadStatusCodeError
    | UnexpectedApiResponseError
    | ZodParseError<BtcPrice>
    | NetworkError,
    BtcPrice
  > {
    // Bulgarian LEV is pegged to Euro and as CoinGecko does not support it
    // we calculate it manually from EUR price
    const currencyToFetch = currency === 'bgn' ? 'eur' : currency
    const ExpectedResponse = z.object({
      bitcoin: z.record(z.literal(currencyToFetch), BtcPrice),
    })

    return pipe(
      axiosCallWithValidation(
        axiosInstance,
        {
          method: 'get',
          url: URL_TEMPLATE + currencyToFetch,
        },
        ExpectedResponse
      ),
      TE.chainEitherKW((val) => {
        if (currency === 'bgn') {
          return safeParse(BtcPrice)(
            Number(val.bitcoin[currencyToFetch]) *
              BULGARIAN_LEV_PEGGED_EURO_RATE
          )
        }
        return safeParse(BtcPrice)(val.bitcoin[currency])
      })
    )
  }
}

export type BtcPricePublicApi = ReturnType<typeof createBtcPriceApi>

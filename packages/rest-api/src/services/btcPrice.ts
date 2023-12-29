import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import z from 'zod'
import {
  type LoggingFunction,
  createAxiosInstance,
  axiosCallWithValidation,
} from '../utils'
import {type PlatformName} from '../PlatformName'
import {
  type BadStatusCodeError,
  type NetworkError,
  type UnexpectedApiResponseError,
  type UnknownError,
} from '../Errors'

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
  UnknownError | BadStatusCodeError | UnexpectedApiResponseError | NetworkError,
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
    | NetworkError,
    number
  > {
    const ExpectedResponse = z.object({
      bitcoin: z.record(z.literal(currency), z.number()),
    })
    return pipe(
      axiosCallWithValidation(
        axiosInstance,
        {method: 'get', url: URL_TEMPLATE + currency},
        ExpectedResponse
      ),
      TE.map((val) => Number(val.bitcoin[currency]))
    )
  }
}

export type BtcPricePublicApi = ReturnType<typeof createBtcPriceApi>

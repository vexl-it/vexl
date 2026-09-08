import {Schema} from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from 'effect/unstable/httpapi'
import {commonApiErrors} from '../../commonApiErrors'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  GetExchangeRateError,
  GetExchangeRateRequest,
  GetExchangeRateResponse,
} from './contracts'

export const GetExchangeRateEndpoint = HttpApiEndpoint.get(
  'getExchangeRate',
  '/btc-rate',
  {
    disableCodecs: true,
    query: GetExchangeRateRequest.fields,
    error: Schema.Union([
      ...commonApiErrors,
      GetExchangeRateError.pipe(HttpApiSchema.status(502)),
    ]),
    success: Schema.Struct(GetExchangeRateResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 500)

const RootGroup = HttpApiGroup.make('root', {topLevel: true}).add(
  GetExchangeRateEndpoint
)

export const BtcExchangeRateApiSpecification = HttpApi.make(
  'Btc exchange rate service'
)
  .add(RootGroup)

  .middleware(RateLimitingMiddleware)

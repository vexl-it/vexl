import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  GetExchangeRateError,
  GetExchangeRateRequest,
  GetExchangeRateResponse,
} from './contracts'

export const GetExchangeRateEndpoint = HttpApiEndpoint.get(
  'getExchangeRate',
  '/btc-rate'
)
  .setUrlParams(GetExchangeRateRequest)
  .addSuccess(GetExchangeRateResponse)
  .addError(GetExchangeRateError, {status: 502})
  .annotate(MaxExpectedDailyCall, 500)

const RootGroup = HttpApiGroup.make('root', {topLevel: true}).add(
  GetExchangeRateEndpoint
)

export const BtcExchangeRateApiSpecification = HttpApi.make(
  'Btc exchange rate service'
)
  .middleware(RateLimitingMiddleware)
  .add(RootGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)

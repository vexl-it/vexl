import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {ServerSecurityMiddleware} from '../../apiSecurity'
import {
  GetExchangeRateError,
  GetExchangeRateRequest,
  GetExchangeRateResponse,
} from './contracts'

export const getExchangeRateErrors = Schema.Union(GetExchangeRateError)
export const GetExchangeRateEndpoint = HttpApiEndpoint.get(
  'getExchangeRate',
  '/btc-rate'
)
  .setUrlParams(GetExchangeRateRequest)
  .addSuccess(GetExchangeRateResponse)
  .middleware(ServerSecurityMiddleware)
  .addError(GetExchangeRateError)

const RootGroup = HttpApiGroup.make('root', {topLevel: true}).add(
  GetExchangeRateEndpoint
)

export const BtcExchangeRateApiSpecification = HttpApi.make(
  'Btc exchange rate service'
)
  .add(RootGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)

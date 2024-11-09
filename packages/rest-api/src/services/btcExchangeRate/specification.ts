import {Schema} from 'effect'
import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {
  GetExchangeRateError,
  GetExchangeRateRequest,
  GetExchangeRateResponse,
} from './contracts'

export const getExchangeRateErrors = Schema.Union(GetExchangeRateError)
export const GetExchangeRateEndpoint = Api.get(
  'getExchangeRate',
  '/btc-rate'
).pipe(
  Api.setRequestQuery(GetExchangeRateRequest),
  Api.setResponseBody(GetExchangeRateResponse),
  Api.setSecurity(ServerSecurity),
  Api.addResponse({
    status: 400 as const,
    body: GetExchangeRateError,
  })
)

export const BtcExchangeRateApiSpecification = Api.make({
  title: 'Btc exchange rate service',
  version: '1.0.0',
}).pipe(Api.addEndpoint(GetExchangeRateEndpoint))

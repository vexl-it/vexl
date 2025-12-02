import {CurrencyCodeE} from '@vexl-next/domain/src/general/currency.brand'
import {UnixMillisecondsE} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

export class GetExchangeRateRequest extends Schema.Class<GetExchangeRateRequest>(
  'GetExchangeRateRequest'
)({
  currency: Schema.Uppercase.pipe((a) => Schema.compose(a, CurrencyCodeE)),
}) {}

export class GetExchangeRateResponse extends Schema.Class<GetExchangeRateResponse>(
  'GetExchangeRateResponse'
)({
  BTC: Schema.Number,
  lastUpdatedAt: Schema.optionalWith(UnixMillisecondsE, {as: 'Option'}),
}) {}

export class GetExchangeRateError extends Schema.TaggedError<GetExchangeRateError>(
  'GetExchangeRateError'
)('GetExchangeRateError', {
  reason: Schema.Literal('YadioError'),
  status: Schema.Literal(502),
}) {}

export const GetExchangeRateInput = Schema.Struct({
  query: GetExchangeRateRequest,
})

export type GetExchangeRateInput = typeof GetExchangeRateInput.Type

import {Schema} from '@effect/schema'
import {CurrencyCodeE} from '@vexl-next/domain/src/general/currency.brand'

export class GetExchangeRateRequest extends Schema.Class<GetExchangeRateRequest>(
  'GetExchangeRateRequest'
)({
  currency: Schema.Uppercase.pipe((a) => Schema.compose(a, CurrencyCodeE)),
}) {}

export class GetExchangeRateResponse extends Schema.Class<GetExchangeRateResponse>(
  'GetExchangeRateResponse'
)({
  BTC: Schema.Number,
}) {}

export class GetExchangeRateError extends Schema.TaggedError<GetExchangeRateError>(
  'GetExchangeRateError'
)('GetExchangeRateError', {
  reason: Schema.Literal('YadioError'),
  status: Schema.Literal(400),
}) {}
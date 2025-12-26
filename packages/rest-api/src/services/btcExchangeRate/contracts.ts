import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

export class GetExchangeRateRequest extends Schema.Class<GetExchangeRateRequest>(
  'GetExchangeRateRequest'
)({
  currency: Schema.Uppercase.pipe((a) => Schema.compose(a, CurrencyCode)),
}) {}

export class GetExchangeRateResponse extends Schema.Class<GetExchangeRateResponse>(
  'GetExchangeRateResponse'
)({
  BTC: Schema.Number,
  lastUpdatedAt: Schema.optionalWith(UnixMilliseconds, {as: 'Option'}),
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

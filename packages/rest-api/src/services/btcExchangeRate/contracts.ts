import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Option, Schema, SchemaTransformation} from 'effect'

export class GetExchangeRateRequest extends Schema.Class<GetExchangeRateRequest>(
  'GetExchangeRateRequest'
)({
  currency: Schema.String.pipe(
    Schema.decodeTo(Schema.String, SchemaTransformation.toUpperCase()),
    Schema.decodeTo(CurrencyCode)
  ),
}) {}

export class GetExchangeRateResponse extends Schema.Class<GetExchangeRateResponse>(
  'GetExchangeRateResponse'
)({
  BTC: Schema.Number,
  lastUpdatedAt: Schema.OptionFromOptional(UnixMilliseconds).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
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

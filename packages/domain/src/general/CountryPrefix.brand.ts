import {Schema} from '@effect/schema'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Brand, Effect} from 'effect'
import {z} from 'zod'
import {type E164PhoneNumber, E164PhoneNumberE} from './E164PhoneNumber.brand'

export const CountryPrefixE = Schema.Number.pipe(Schema.brand('CountryPrefix'))
export const CountryPrefix = z
  .number()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'CountryPrefix'>>()(v))

export type CountryPrefix = Schema.Schema.Type<typeof CountryPrefixE>

export class UnknownCountryPrefix extends Schema.TaggedError<UnknownCountryPrefix>(
  'UnknownCountryPrefix'
)('UnknownCountryPrefix', {
  number: E164PhoneNumberE,
}) {}
export const countryPrefixFromNumber = (
  number: E164PhoneNumber
): Effect.Effect<CountryPrefix, UnknownCountryPrefix> =>
  Effect.try({
    try: () => parsePhoneNumber(number).countryCode,
    catch: () => new UnknownCountryPrefix({number}),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(CountryPrefixE)),
    Effect.catchAll(() => Effect.fail(new UnknownCountryPrefix({number})))
  )

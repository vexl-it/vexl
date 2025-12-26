import {parsePhoneNumber} from 'awesome-phonenumber'
import {Effect, Schema} from 'effect'
import {E164PhoneNumber} from './E164PhoneNumber.brand'

export const CountryPrefix = Schema.Number.pipe(Schema.brand('CountryPrefix'))
export type CountryPrefix = Schema.Schema.Type<typeof CountryPrefix>

export class UnknownCountryPrefix extends Schema.TaggedError<UnknownCountryPrefix>(
  'UnknownCountryPrefix'
)('UnknownCountryPrefix', {
  number: E164PhoneNumber,
}) {}
export const countryPrefixFromNumber = (
  number: E164PhoneNumber
): Effect.Effect<CountryPrefix, UnknownCountryPrefix> =>
  Effect.try({
    try: () => parsePhoneNumber(number).countryCode,
    catch: () => new UnknownCountryPrefix({number}),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(CountryPrefix)),
    Effect.catchAll(() => Effect.fail(new UnknownCountryPrefix({number})))
  )

import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  type RequestedVerificationChannel,
  type UnableToSendVerificationSmsError,
  type UnableToVerifySmsCodeError,
  type VerificationChannel,
  type VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Array, Effect, Option, type ConfigError} from 'effect/index'
import {whatsappPreferredPrefixesConfig} from '../configs'
import {PreludeService} from './prelude'
import {type SmsVerificationSid} from './SmsVerificationSid.brand'

/**
 * Decides which channel to use for delivering the verification code.
 *
 * Clients that do not send a requested channel are older builds whose UI only
 * talks about sms - they must keep receiving sms. `auto` resolves to whatsapp
 * for country prefixes listed in WHATSAPP_PREFERRED_PREFIXES (countries with
 * unreliable sms delivery), otherwise sms. An explicit channel is honored
 * as is (user tapped "send via whatsapp/sms instead").
 */
export const resolveVerificationChannel = (
  requestedChannel: RequestedVerificationChannel | undefined,
  countryPrefix: CountryPrefix
): Effect.Effect<VerificationChannel, ConfigError.ConfigError> =>
  Effect.gen(function* (_) {
    if (requestedChannel === undefined) return 'sms'
    if (requestedChannel !== 'auto') return requestedChannel

    const whatsappPreferredPrefixes = yield* _(whatsappPreferredPrefixesConfig)
    return Option.isSome(whatsappPreferredPrefixes) &&
      Array.contains(whatsappPreferredPrefixes.value, countryPrefix)
      ? 'whatsapp'
      : 'sms'
  })

export const createVerification = (
  phone: E164PhoneNumber,
  requestHeaders: CommonHeaders,
  channel: VerificationChannel
): Effect.Effect<
  SmsVerificationSid,
  UnableToSendVerificationSmsError | ConfigError.ConfigError,
  PreludeService
> =>
  PreludeService.pipe(
    Effect.flatMap((provider) =>
      provider.createVerification(phone, requestHeaders, channel)
    )
  )

export const checkVerification = (args: {
  sid: SmsVerificationSid
  code: string
}): Effect.Effect<
  'valid',
  | UnableToVerifySmsCodeError
  | VerificationNotFoundError
  | ConfigError.ConfigError,
  PreludeService
> =>
  PreludeService.pipe(
    Effect.flatMap((provider) => provider.checkVerification(args))
  )

import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type UnableToSendVerificationSmsError,
  type UnableToVerifySmsCodeError,
  type VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, type ConfigError} from 'effect/index'
import {verificationProviderConfig} from '../configs'
import {PreludeService} from './prelude'
import {type SmsVerificationSid} from './SmsVerificationSid.brand'
import {TwilioVerificationClient} from './twilio'

const getVerificationProvider = Effect.gen(function* (_) {
  const verificationProvider = yield* _(verificationProviderConfig)
  if (verificationProvider === 'twilio')
    return yield* _(TwilioVerificationClient)
  else return yield* _(PreludeService)
})

export const createVerification = (
  phone: E164PhoneNumber
): Effect.Effect<
  SmsVerificationSid,
  UnableToSendVerificationSmsError | ConfigError.ConfigError,
  TwilioVerificationClient | PreludeService
> =>
  getVerificationProvider.pipe(
    Effect.flatMap((provider) => provider.createVerification(phone))
  )

export const checkVerification = (args: {
  sid: SmsVerificationSid
  code: string
}): Effect.Effect<
  'valid',
  | UnableToVerifySmsCodeError
  | VerificationNotFoundError
  | ConfigError.ConfigError,
  TwilioVerificationClient | PreludeService
> =>
  getVerificationProvider.pipe(
    Effect.flatMap((provider) => provider.checkVerification(args))
  )

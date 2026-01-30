import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  type UnableToSendVerificationSmsError,
  type UnableToVerifySmsCodeError,
  type VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, type ConfigError} from 'effect/index'
import {PreludeService} from './prelude'
import {type SmsVerificationSid} from './SmsVerificationSid.brand'

export const createVerification = (
  phone: E164PhoneNumber,
  requestHeaders: CommonHeaders
): Effect.Effect<
  SmsVerificationSid,
  UnableToSendVerificationSmsError | ConfigError.ConfigError,
  PreludeService
> =>
  PreludeService.pipe(
    Effect.flatMap((provider) =>
      provider.createVerification(phone, requestHeaders)
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

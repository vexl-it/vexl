import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Config, ConfigError, Effect, Either, Schema, String} from 'effect'

export {
  cryptoConfig,
  databaseConfig,
  easKey,
  healthServerPortConfig,
  hmacKey,
  isRunningInDevelopmentConfig,
  isRunningInTestConfig,
  nodeEnvConfig,
  portConfig,
  redisUrl,
  secretPrivateKey,
  secretPublicKey,
} from '@vexl-next/server-utils/src/commonConfigs'

export const twilioConfig = Config.unwrap({
  accountSid: Config.string('TWILIO_SID'),
  authToken: Config.string('TWILIO_TOKEN'),
  verifyServiceSid: Config.string('TWILIO_VERIFY_SERVICE_SID'),
})

export const loginCodeDummies = Config.option(
  Config.unwrap({
    numbers: Config.string('LOGIN_CODE_DUMMY_NUMBERS').pipe(
      Config.map(String.split(',')),
      Config.mapOrFail((v) =>
        Either.mapLeft(
          Schema.decodeEither(Schema.Array(E164PhoneNumberE))(v),
          (e) =>
            ConfigError.InvalidData(['LOGIN_CODE_DUMMY_NUMBERS'], e.message)
        )
      )
    ),
    code: Config.string('LOGIN_CODE_DUMMY_CODE'),
  })
)

export const loginCodeDummyForAll = Config.option(
  Config.string('LOGIN_CODE_DUMMY_FOR_ALL')
)

export const dashboardNewUserHookConfig = Config.option(
  Config.string('DASHBOARD_NEW_USER_HOOK')
)

export const feedbackServiceUrlToRedirectToConfig = Config.string(
  'FEEDBACK_URL_TO_REDIRECT_TO'
)

export const oldHmacKeyUsedForHashingNumbersConfig =
  Config.string('OLD_HMAC_KEY')

export const preludeApiTokenConfig = Config.string('PRELUDE_API_TOKEN')

export const verificationProviderConfig = Config.string(
  'VERIFICATION_PROVIDER'
).pipe(
  Config.validate({
    message:
      'Invalid verification provider. Should be one of "twilio" or "prelude"',
    validation: (v) => v === 'twilio' || v === 'prelude',
  })
)

export const lowestSupportVersionToLoginConfig = Config.number(
  'LOWEST_SUPPORT_VERSION_TO_LOGIN'
).pipe(Config.withDefault(0), Effect.flatMap(Schema.decode(VersionCode)))
export const allowLoginWithoutAllHeadersConfig = Config.boolean(
  'ALLOW_LOGIN_WITHOUT_ALL_HEADERS'
).pipe(Config.withDefault(true))
export const allowLoginWithoutChallengeConfig = Config.boolean(
  'ALLOW_LOGIN_WITHOUT_CHALLENGE'
).pipe(Config.withDefault(true))

import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
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

export const loginCodeDummies = Config.option(
  Config.unwrap({
    numbers: Config.string('LOGIN_CODE_DUMMY_NUMBERS').pipe(
      Config.map(String.split(',')),
      Config.mapOrFail((v) =>
        Either.mapLeft(
          Schema.decodeEither(Schema.Array(E164PhoneNumber))(v),
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

export const turnstileSecretKeyConfig = Config.option(
  Config.string('TURNSTILE_SECRET_KEY')
)

export const turnstileExpectedHostnameConfig = Config.option(
  Config.string('TURNSTILE_EXPECTED_HOSTNAME')
)

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

export const rerequestLimitDaysConfig = Config.number(
  'REREQUEST_LIMIT_DAYS'
).pipe(
  Config.withDefault(1),
  Config.validate({
    message: 'REREQUEST_LIMIT_DAYS must be a positive integer or 0',
    validation: (v) => Number.isInteger(v) && v >= 0,
  })
)

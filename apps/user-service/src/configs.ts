import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Config, Effect, Schema, String} from 'effect'

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
        Schema.decodeEffect(Schema.Array(E164PhoneNumber))(v).pipe(
          Effect.mapError((error) => new Config.ConfigError(error))
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

export const verificationProviderConfig = Config.schema(
  Schema.Literals(['twilio', 'prelude']),
  'VERIFICATION_PROVIDER'
)

export const lowestSupportVersionToLoginConfig = Config.number(
  'LOWEST_SUPPORT_VERSION_TO_LOGIN'
).pipe(Config.withDefault(0), Effect.flatMap(Schema.decodeEffect(VersionCode)))

export const rerequestLimitDaysConfig = Config.schema(
  Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  'REREQUEST_LIMIT_DAYS'
).pipe(Config.withDefault(1))

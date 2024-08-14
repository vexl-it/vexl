import {Schema} from '@effect/schema'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Config, ConfigError, Either, String} from 'effect'

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

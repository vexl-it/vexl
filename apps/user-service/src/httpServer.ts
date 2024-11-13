import {NodeContext} from '@effect/platform-node'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {Config, Effect, Layer, Option} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {
  cryptoConfig,
  dashboardNewUserHookConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import DbLayer from './db/layer'
import {LoggedInUsersDbService} from './db/loggedInUsersDb'
import {reportMetricsLayer} from './metrics'
import {VerificationStateDbService} from './routes/login/db/verificationStateDb'
import {initVerificationHandler} from './routes/login/handlers/initVerificationHandler'
import {verifyChallengeHandler} from './routes/login/handlers/verifyChallengeHandler'
import {verifyCodeHandler} from './routes/login/handlers/verifyCodeHandler'
import {logoutUserHandler} from './routes/logoutUser'
import {regenerateCredentialsHandler} from './routes/regenerateSessionCredentials'
import {submitFeedbackHandler} from './routes/submitFeedback'
import {TwilioVerificationClient} from './utils/twilio'

export const app = RouterBuilder.make(UserApiSpecification).pipe(
  RouterBuilder.handle(initVerificationHandler),
  RouterBuilder.handle(verifyCodeHandler),
  RouterBuilder.handle(verifyChallengeHandler),
  RouterBuilder.handle(logoutUserHandler),
  RouterBuilder.handle(submitFeedbackHandler),
  RouterBuilder.handle(regenerateCredentialsHandler),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  TwilioVerificationClient.Live,
  VerificationStateDbService.Live,
  LoggedInUsersDbService.Live,
  DashboardReportsService.make({
    newUserHookOption: dashboardNewUserHookConfig,
    contactsImportedHookConfig: Config.succeed(Option.none()),
  }),
  reportMetricsLayer,
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(MetricsClientService.layer(redisUrl)),
  Layer.provideMerge(RedisService.layer(redisUrl)),
  Layer.provideMerge(NodeContext.layer)
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)

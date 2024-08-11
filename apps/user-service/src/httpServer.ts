import {NodeContext} from '@effect/platform-node'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {
  cryptoConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import DbLayer from './db/layer'
import {LoggedInUsersDbService} from './db/loggedInUsersDb'
import {VerificationStateDbService} from './routes/login/db/verificationStateDb'
import {initVerificationHandler} from './routes/login/handlers/initVerificationHandler'
import {verifyChallengeHandler} from './routes/login/handlers/verifyChallengeHandler'
import {verifyCodeHandler} from './routes/login/handlers/verifyCodeHandler'
import {DashboardReportsService} from './routes/login/utils/DashboardReportsService'
import {logoutUserHandler} from './routes/logoutUser'
import {TwilioVerificationClient} from './utils/twilio'

export const app = RouterBuilder.make(UserApiSpecification).pipe(
  RouterBuilder.handle(initVerificationHandler),
  RouterBuilder.handle(verifyCodeHandler),
  RouterBuilder.handle(verifyChallengeHandler),
  RouterBuilder.handle(logoutUserHandler),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  TwilioVerificationClient.Live,
  VerificationStateDbService.Live,
  LoggedInUsersDbService.Live,
  DashboardReportsService.Live,
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(RedisService.layer(redisUrl)),
  Layer.provideMerge(NodeContext.layer)
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)

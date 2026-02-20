import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {Config, Layer, Option} from 'effect'
import {
  cryptoConfig,
  dashboardNewUserHookConfig,
  healthServerPortConfig,
  redisUrl,
} from './configs'
import DbLayer from './db/layer'
import {reportMetricsLayer} from './metrics'
import {initEraseUserEndpoint} from './routes/eraseUser/handlers/initEraseUser'
import {verifyAndEraseUser} from './routes/eraseUser/handlers/verifyAndEraseUser'
import {generateLoginChallengeHandler} from './routes/generateLoginChallenge'
import {getVersionServiceInfoHandler} from './routes/getVersionServiceInfo'
import {initVerificationHandler} from './routes/login/handlers/initVerificationHandler'
import {verifyChallengeHandler} from './routes/login/handlers/verifyChallengeHandler'
import {verifyCodeHandler} from './routes/login/handlers/verifyCodeHandler'
import {logoutUserHandler} from './routes/logoutUser'
import {initUpgradeAuthHandler} from './routes/upgradeAuth/initUpgradeAuth'
import {submitUpgradeAuthHandler} from './routes/upgradeAuth/submitUpgradeAuth'

import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {LoggedInUsersDbService} from './db/loggedInUsersDb'
import {VerificationStateDbService} from './routes/login/db/verificationStateDb'
import {PreludeService} from './utils/prelude'

const LoginApiGroupLive = HttpApiBuilder.group(
  UserApiSpecification,
  'Login',
  (h) =>
    h
      .handle('initVerification', initVerificationHandler)
      .handle('verifyCode', verifyCodeHandler)
      .handle('verifyChallenge', verifyChallengeHandler)
)

const EraseUserApiGroupLive = HttpApiBuilder.group(
  UserApiSpecification,
  'EraseUser',
  (h) =>
    h
      .handle('initEraseUser', initEraseUserEndpoint)
      .handle('verifyAndEraseuser', verifyAndEraseUser)
)

const RootApiGroupLive = HttpApiBuilder.group(
  UserApiSpecification,
  'root',
  (h) =>
    h
      .handle('logoutUser', logoutUserHandler)
      .handle('getVersionServiceInfo', getVersionServiceInfoHandler)
      .handle('generateLoginChallenge', generateLoginChallengeHandler)
)

const UpgradeAuthApiGroupLive = HttpApiBuilder.group(
  UserApiSpecification,
  'UpgradeAuth',
  (h) =>
    h
      .handle('initUpgradeAuth', initUpgradeAuthHandler)
      .handle('submitUpgradeAuth', submitUpgradeAuthHandler)
)

export const UserApiLive = HttpApiBuilder.api(UserApiSpecification).pipe(
  Layer.provide(LoginApiGroupLive),
  Layer.provide(EraseUserApiGroupLive),
  Layer.provide(UpgradeAuthApiGroupLive),
  Layer.provide(RootApiGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(UserApiSpecification)),
  Layer.provide(ServerSecurityMiddlewareLive)
)

export const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(UserApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)

export const HttpServerLive = Layer.mergeAll(
  ApiServerLive,
  reportMetricsLayer,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provideMerge(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(PreludeService.Live),
  Layer.provideMerge(MetricsClientService.Live),
  Layer.provideMerge(
    DashboardReportsService.make({
      newUserHookOption: dashboardNewUserHookConfig,
      contactsImportedHookConfig: Config.succeed(Option.none()),
    })
  ),
  Layer.provideMerge(VerificationStateDbService.Live),
  Layer.provideMerge(LoggedInUsersDbService.Live),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(RedisService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl))
)

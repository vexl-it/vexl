import {NodeContext} from '@effect/platform-node'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Config, Effect, Layer, Option} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {
  cryptoConfig,
  dashboardContactsImportedHookConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import {ContactDbService} from './db/ContactDbService'
import DbLayer from './db/layer'
import {UserDbService} from './db/UserDbService'
import {internalServerLive} from './internalServer'
import {reportGaguesLayer} from './metrics'
import {fetchCommonConnections} from './routes/contacts/fetchCommonConnections'
import {fetchMyContacts} from './routes/contacts/fetchMyContacts'
import {importContacts} from './routes/contacts/importContacts'
import {checkUserExists} from './routes/user/checkUserExists'
import {createUser} from './routes/user/createUser'
import {deleteUser} from './routes/user/deleteUser'
import {refreshUser} from './routes/user/refreshUser'
import {updateBadOwnerHash} from './routes/user/updateBadOwnerHash'
import {updateFirebaseToken} from './routes/user/updateFirebaseToken'
import {FirebaseMessagingService} from './utils/notifications/FirebaseMessagingService'

export const app = RouterBuilder.make(ContactApiSpecification).pipe(
  RouterBuilder.handle(checkUserExists),
  RouterBuilder.handle(createUser),
  RouterBuilder.handle(refreshUser),
  RouterBuilder.handle(updateFirebaseToken),
  RouterBuilder.handle(deleteUser),
  RouterBuilder.handle(importContacts),
  RouterBuilder.handle(fetchMyContacts),
  RouterBuilder.handle(fetchCommonConnections),
  RouterBuilder.handle(updateBadOwnerHash),
  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  reportGaguesLayer,
  internalServerLive,
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provideMerge(FirebaseMessagingService.Live),
  Layer.provideMerge(ContactDbService.Live),
  Layer.provideMerge(UserDbService.Live),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(RedisService.layer(redisUrl)),
  Layer.provideMerge(NodeContext.layer),
  Layer.provideMerge(
    DashboardReportsService.make({
      contactsImportedHookConfig: dashboardContactsImportedHookConfig,
      newUserHookOption: Config.succeed(Option.none()),
    })
  )
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)

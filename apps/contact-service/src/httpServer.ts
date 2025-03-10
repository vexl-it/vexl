import {NodeContext} from '@effect/platform-node'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
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
  dashboardContactsImportedHookConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import {ClubInvitationLinkDbService} from './db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from './db/ClubMemberDbService'
import {ClubsDbService} from './db/ClubsDbService'
import {ContactDbService} from './db/ContactDbService'
import {UserDbService} from './db/UserDbService'
import DbLayer from './db/layer'
import {internalServerLive} from './internalServer'
import {reportGaguesLayer} from './metrics'
import {createClub} from './routes/clubs/admin/createClub'
import {generateClubInviteLink} from './routes/clubs/admin/generateClubInviteLink'
import {listClubs} from './routes/clubs/admin/listClubs'
import {modifyClub} from './routes/clubs/admin/modifyClub'
import {fetchCommonConnections} from './routes/contacts/fetchCommonConnections'
import {fetchMyContacts} from './routes/contacts/fetchMyContacts'
import {importContacts} from './routes/contacts/importContacts'
import {ImportContactsQuotaService} from './routes/contacts/importContactsQuotaService'
import {checkUserExists} from './routes/user/checkUserExists'
import {createUser} from './routes/user/createUser'
import {deleteUser} from './routes/user/deleteUser'
import {refreshUser} from './routes/user/refreshUser'
import {updateBadOwnerHash} from './routes/user/updateBadOwnerHash'
import {updateFirebaseToken} from './routes/user/updateFirebaseToken'
import {updateNotificationToken} from './routes/user/updateNotificationToken'
import {ExpoNotificationsService} from './utils/expoNotifications/ExpoNotificationsService'
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
  RouterBuilder.handle(createClub),
  RouterBuilder.handle(generateClubInviteLink),
  RouterBuilder.handle(listClubs),
  RouterBuilder.handle(modifyClub),
  RouterBuilder.handle(updateNotificationToken),
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
  Layer.provideMerge(ExpoNotificationsService.Live),
  Layer.provideMerge(ContactDbService.Live),
  Layer.provideMerge(ImportContactsQuotaService.Live),
  Layer.provideMerge(UserDbService.Live),
  Layer.provideMerge(ClubsDbService.Live),
  Layer.provideMerge(ClubMembersDbService.Live),
  Layer.provideMerge(ClubInvitationLinkDbService.Live),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(RedisService.layer(redisUrl)),
  Layer.provideMerge(MetricsClientService.layer(redisUrl)),
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

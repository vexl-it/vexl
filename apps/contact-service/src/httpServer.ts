import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'

import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {ChallengeService} from '@vexl-next/server-utils/src/services/challenge/ChallengeService'
import {ChallengeDbService} from '@vexl-next/server-utils/src/services/challenge/db/ChallegeDbService'
import {createChallenge} from '@vexl-next/server-utils/src/services/challenge/routes/createChalenge'
import {createChallenges} from '@vexl-next/server-utils/src/services/challenge/routes/createChallenges'
import {Config, Layer, Option} from 'effect'
import {
  cryptoConfig,
  dashboardContactsImportedHookConfig,
  healthServerPortConfig,
  redisUrl,
} from './configs'
import {ClubInvitationLinkDbService} from './db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from './db/ClubMemberDbService'
import {ClubsDbService} from './db/ClubsDbService'
import {ContactDbService} from './db/ContactDbService'
import {UserDbService} from './db/UserDbService'
import DbLayer from './db/layer'
import {internalServerLive} from './internalServer'

import {migratePhoneNumberHashes} from './internalServer/routes/migratePhoneNumberHashes'
import {reportGaguesLayer} from './metrics'
import {sendBulkNotificationHandler} from './routes/admin/sendBulkMessages'
import {createClub} from './routes/clubs/admin/createClub'
import {generateClubInviteLink} from './routes/clubs/admin/generateClubInviteLink'
import {listClubs} from './routes/clubs/admin/listClubs'
import {modifyClub} from './routes/clubs/admin/modifyClub'
import {getClubContacts} from './routes/clubs/member/getClubContacts'
import {getClubInfo} from './routes/clubs/member/getClubInfo'
import {getClubInfoByAccessCode} from './routes/clubs/member/getClubInfoByAccessCode'
import {joinClub} from './routes/clubs/member/joinClub'
import {leaveClub} from './routes/clubs/member/leaveClub'
import {reportClub} from './routes/clubs/member/reportClub'
import {addUserToTheClub} from './routes/clubs/moderator/addUserToTheClub'
import {deactivateClubJoinLink} from './routes/clubs/moderator/deactivateClubJoinLink'
import {generateClubJoinLink} from './routes/clubs/moderator/generateClubJoinLink'
import {listClubLinks} from './routes/clubs/moderator/listClubLinks'
import {convertPhoneNumberHashesToServerHashes} from './routes/contacts/convertPhoneNumberHashesToServerHashes'
import {fetchCommonConnections} from './routes/contacts/fetchCommonConnections'
import {fetchCommonConnectionsPaginated} from './routes/contacts/fetchCommonConnectionsPaginated'
import {fetchMyContacts} from './routes/contacts/fetchMyContacts'
import {fetchMyContactsPaginated} from './routes/contacts/fetchMyContactsPaginated'
import {importContacts} from './routes/contacts/importContacts'
import {ImportContactsQuotaService} from './routes/contacts/importContactsQuotaService'
import {checkUserExists} from './routes/user/checkUserExists'
import {createUser} from './routes/user/createUser'
import {deleteUser} from './routes/user/deleteUser'
import {eraseUserFromNetwork} from './routes/user/eraseUserFromNetwork'
import {refreshUser} from './routes/user/refreshUser'
import {updateBadOwnerHash} from './routes/user/updateBadOwnerHash'
import {updateFirebaseToken} from './routes/user/updateFirebaseToken'
import {updateNotificationToken} from './routes/user/updateNotificationToken'
import {NewClubUserNotificationsService} from './utils/NewClubUserNotificationService'
import {ExpoNotificationsService} from './utils/expoNotifications/ExpoNotificationsService'
import {FirebaseMessagingService} from './utils/notifications/FirebaseMessagingService'

const UserApiGroupLive = HttpApiBuilder.group(
  ContactApiSpecification,
  'User',
  (h) =>
    h
      .handle('checkUserExists', checkUserExists)
      .handle('createUser', createUser)
      .handle('refreshUser', refreshUser)
      .handle('updateFirebaseToken', updateFirebaseToken)
      .handle('deleteUser', deleteUser)
      .handle('eraseUserFromNetwork', eraseUserFromNetwork)
      .handle('updateBadOwnerHash', updateBadOwnerHash)
      .handle('updateNotificationToken', updateNotificationToken)
)

const ContactApiGroupLive = HttpApiBuilder.group(
  ContactApiSpecification,
  'Contact',
  (h) =>
    h
      .handle('importContacts', importContacts)
      .handle('fetchMyContacts', fetchMyContacts)
      .handle('fetchMyContactsPaginated', fetchMyContactsPaginated)
      .handle('fetchCommonConnections', fetchCommonConnections)
      .handle(
        'fetchCommonConnectionsPaginated',
        fetchCommonConnectionsPaginated
      )
      .handle(
        'convertPhoneNumberHashesToServerHashes',
        convertPhoneNumberHashesToServerHashes
      )
)

const ClubsAdminApiGroupLive = HttpApiBuilder.group(
  ContactApiSpecification,
  'ClubsAdmin',
  (h) =>
    h
      .handle('createClub', createClub)
      .handle('modifyClub', modifyClub)
      .handle('generateClubInviteLinkForAdmin', generateClubInviteLink)
      .handle('listClubs', listClubs)
)

const ClubsMemberApiGroupLive = HttpApiBuilder.group(
  ContactApiSpecification,
  'ClubsMember',
  (h) =>
    h
      .handle('getClubInfo', getClubInfo)
      .handle('joinClub', joinClub)
      .handle('leaveClub', leaveClub)
      .handle('getClubContacts', getClubContacts)
      .handle('getClubInfoByAccessCode', getClubInfoByAccessCode)
      .handle('reportClub', reportClub)
)

const ClubsModeratorApiGroupLive = HttpApiBuilder.group(
  ContactApiSpecification,
  'ClubsModerator',
  (h) =>
    h
      .handle('generateClubJoinLink', generateClubJoinLink)
      .handle('deactivateClubJoinLink', deactivateClubJoinLink)
      .handle('addUserToTheClub', addUserToTheClub)
      .handle('listClubLinks', listClubLinks)
)

const AdminApiGroupLive = HttpApiBuilder.group(
  ContactApiSpecification,
  'Admin',
  (h) => h.handle('sendBulkNotification', sendBulkNotificationHandler)
)

const ChallengeApiGroupLive = HttpApiBuilder.group(
  ContactApiSpecification,
  'Challenges',
  (h) =>
    h
      .handle('createChallenge', createChallenge)
      .handle('createChallengeBatch', createChallenges)
)

export const ContactApiLive = HttpApiBuilder.api(ContactApiSpecification).pipe(
  Layer.provide(UserApiGroupLive),
  Layer.provide(ContactApiGroupLive),
  Layer.provide(ClubsAdminApiGroupLive),
  Layer.provide(ClubsMemberApiGroupLive),
  Layer.provide(ClubsModeratorApiGroupLive),
  Layer.provide(AdminApiGroupLive),
  Layer.provide(ChallengeApiGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(ContactApiSpecification)),
  Layer.provide(ServerSecurityMiddlewareLive)
)

export const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ContactApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)

const DbsLive = Layer.mergeAll(
  ContactDbService.Live,
  UserDbService.Live,
  ClubsDbService.Live,
  ChallengeDbService.Live,
  ClubMembersDbService.Live,
  ClubInvitationLinkDbService.Live
).pipe(Layer.provideMerge(DbLayer))

export const HttpServerLive = Layer.mergeAll(
  Layer.effectDiscard(migratePhoneNumberHashes),
  ApiServerLive,
  reportGaguesLayer,
  internalServerLive,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provide(RateLimitingService.Live),
  Layer.provide(FirebaseMessagingService.Live),
  Layer.provide(ExpoNotificationsService.Live),
  Layer.provide(ImportContactsQuotaService.Live),
  Layer.provide(NewClubUserNotificationsService.Live),
  Layer.provide(ChallengeService.Live),
  Layer.provide(DbsLive),
  Layer.provide(RedisService.Live),
  Layer.provide(MetricsClientService.Live),
  Layer.provide(RedisConnectionService.layer(redisUrl)),
  Layer.provide(ServerCrypto.layer(cryptoConfig)),
  Layer.provide(
    DashboardReportsService.make({
      contactsImportedHookConfig: dashboardContactsImportedHookConfig,
      newUserHookOption: Config.succeed(Option.none()),
    })
  )
)

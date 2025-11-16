import {
  HttpApiBuilder,
  HttpApiSwagger,
  HttpMiddleware,
  HttpServer,
} from '@effect/platform/index'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {NodeHttpServerLiveWithPortFromEnv} from '@vexl-next/server-utils/src/NodeHttpServerLiveWithPortFromEnv'
import {rateLimitingMiddlewareLayer} from '@vexl-next/server-utils/src/RateLimiting/rateLimitngMiddlewareLayer'

import {RateLimitingService} from '@vexl-next/server-utils/src/RateLimiting'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ServerSecurityMiddlewareLive} from '@vexl-next/server-utils/src/serverSecurity'
import {ChallengeService} from '@vexl-next/server-utils/src/services/challenge/ChallengeService'
import {ChallengeDbService} from '@vexl-next/server-utils/src/services/challenge/db/ChallegeDbService'
import {createChallenge} from '@vexl-next/server-utils/src/services/challenge/routes/createChalenge'
import {createChallenges} from '@vexl-next/server-utils/src/services/challenge/routes/createChallenges'
import {Layer} from 'effect'
import {cryptoConfig, healthServerPortConfig, redisUrl} from './configs'
import {InboxDbService} from './db/InboxDbService'
import {MessagesDbService} from './db/MessagesDbService'
import {WhitelistDbService} from './db/WhiteListDbService'
import DbLayer from './db/layer'
import {InternalServerLive} from './internalServer'
import {reportMetricsLayer} from './metrics'
import {approveRequest} from './routes/inbox/approveReqest'
import {blockInbox} from './routes/inbox/blockInbox'
import {cancelRequest, cancelRequestV2} from './routes/inbox/cancelRequest'
import {createInbox} from './routes/inbox/createInbox'
import {deleteInbox} from './routes/inbox/deleteInbox'
import {deleteInboxes} from './routes/inbox/deleteInboxes'
import {deletePulledMessages} from './routes/inbox/deletePulledMessages'
import {leaveChat} from './routes/inbox/leaveChat'
import {
  requestApproval,
  requestApprovalV2,
} from './routes/inbox/requestApproval'
import {updateInbox} from './routes/inbox/updateInbox'
import {retrieveMessages} from './routes/messages/retrieveMessages'
import {sendMessage} from './routes/messages/sendMessage'
import {sendMessages} from './routes/messages/sendMessages'

const ChallengeApiGroupLive = HttpApiBuilder.group(
  ChatApiSpecification,
  'Challenges',
  (h) =>
    h
      .handle('createChallenge', createChallenge)
      .handle('createChallengeBatch', createChallenges)
)

const InboxesApiGroupLive = HttpApiBuilder.group(
  ChatApiSpecification,
  'Inboxes',
  (h) =>
    h
      .handle('updateInbox', updateInbox)
      .handle('createInbox', createInbox)
      .handle('deleteInbox', deleteInbox)
      .handle('blockInbox', blockInbox)
      .handle('requestApproval', requestApproval)
      .handle('requestApprovalV2', requestApprovalV2)
      .handle('cancelRequestApproval', cancelRequest)
      .handle('cancelRequestApprovalV2', cancelRequestV2)
      .handle('approveRequest', approveRequest)
      .handle('deleteInboxes', deleteInboxes)
      .handle('leaveChat', leaveChat)
      .handle('deletePulledMessages', deletePulledMessages)
)

const MessagesApiGroupLive = HttpApiBuilder.group(
  ChatApiSpecification,
  'Messages',
  (h) =>
    h
      .handle('retrieveMessages', retrieveMessages)
      .handle('sendMessage', sendMessage)
      .handle('sendMessages', sendMessages)
)

export const ChatApiLive = HttpApiBuilder.api(ChatApiSpecification).pipe(
  Layer.provide(ChallengeApiGroupLive),
  Layer.provide(InboxesApiGroupLive),
  Layer.provide(MessagesApiGroupLive),
  Layer.provide(rateLimitingMiddlewareLayer(ChatApiSpecification)),
  Layer.provide(ServerSecurityMiddlewareLive)
)

export const ApiServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ChatApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServerLiveWithPortFromEnv)
)

export const HttpServerLive = Layer.mergeAll(
  ApiServerLive,
  InternalServerLive,
  reportMetricsLayer,
  healthServerLayer({port: healthServerPortConfig})
).pipe(
  Layer.provide(ChallengeService.Live),
  Layer.provideMerge(RateLimitingService.Live),
  Layer.provide(ServerCrypto.layer(cryptoConfig)),
  Layer.provideMerge(
    Layer.mergeAll(
      ChallengeDbService.Live,
      InboxDbService.Live,
      MessagesDbService.Live,
      WhitelistDbService.Live
    )
  ),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(MetricsClientService.Live),
  Layer.provideMerge(RedisService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl))
)

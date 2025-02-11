import {NodeContext} from '@effect/platform-node'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {ChallengeService} from '@vexl-next/server-utils/src/services/challenge/ChallengeService'
import {ChallengeDbService} from '@vexl-next/server-utils/src/services/challenge/db/ChallegeDbService'
import {createChallenge} from '@vexl-next/server-utils/src/services/challenge/routes/createChalenge'
import {createChallenges} from '@vexl-next/server-utils/src/services/challenge/routes/createChallenges'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {
  cryptoConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import {InboxDbService} from './db/InboxDbService'
import {MessagesDbService} from './db/MessagesDbService'
import {WhitelistDbService} from './db/WhiteListDbService'
import DbLayer from './db/layer'
import {InternalServerLive} from './internalServer'
import {reportMetricsLayer} from './metrics'
import {approveRequest} from './routes/inbox/approveReqest'
import {blockInbox} from './routes/inbox/blockInbox'
import {cancelRequest} from './routes/inbox/cancelRequest'
import {createInbox} from './routes/inbox/createInbox'
import {deleteInbox} from './routes/inbox/deleteInbox'
import {deleteInboxes} from './routes/inbox/deleteInboxes'
import {deletePulledMessages} from './routes/inbox/deletePulledMessages'
import {leaveChat} from './routes/inbox/leaveChat'
import {requestApproval} from './routes/inbox/requestApproval'
import {updateInbox} from './routes/inbox/updateInbox'
import {retrieveMessages} from './routes/messages/retrieveMessages'
import {sendMessage} from './routes/messages/sendMessage'
import {sendMessages} from './routes/messages/sendMessages'

export const app = RouterBuilder.make(ChatApiSpecification).pipe(
  // challenges
  RouterBuilder.handle(createChallenge),
  RouterBuilder.handle(createChallenges),
  // inbox
  RouterBuilder.handle(approveRequest),
  RouterBuilder.handle(blockInbox),
  RouterBuilder.handle(cancelRequest),
  RouterBuilder.handle(createInbox),
  RouterBuilder.handle(deleteInbox),
  RouterBuilder.handle(deleteInboxes),
  RouterBuilder.handle(updateInbox),
  RouterBuilder.handle(requestApproval),
  RouterBuilder.handle(leaveChat),
  RouterBuilder.handle(deletePulledMessages),
  // messages
  RouterBuilder.handle(retrieveMessages),
  RouterBuilder.handle(sendMessage),
  RouterBuilder.handle(sendMessages),

  RouterBuilder.build,
  setupLoggingMiddlewares
)

const MainLive = Layer.mergeAll(
  InternalServerLive,
  reportMetricsLayer,
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig}),
  ChallengeService.Live
).pipe(
  Layer.provideMerge(
    Layer.mergeAll(
      ChallengeDbService.Live,
      InboxDbService.Live,
      MessagesDbService.Live,
      WhitelistDbService.Live
    )
  ),
  Layer.provideMerge(DbLayer),
  Layer.provideMerge(MetricsClientService.layer(redisUrl)),
  Layer.provideMerge(RedisService.layer(redisUrl)),
  Layer.provideMerge(NodeContext.layer)
)

export const httpServer = portConfig.pipe(
  Effect.flatMap((port) => NodeServer.listen({port})(app)),
  Effect.provide(MainLive)
)

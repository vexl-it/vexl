import {NodeContext} from '@effect/platform-node'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {setupLoggingMiddlewares} from '@vexl-next/server-utils/src/loggingMiddlewares'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {Effect, Layer} from 'effect'
import {RouterBuilder} from 'effect-http'
import {NodeServer} from 'effect-http-node'
import {
  cryptoConfig,
  healthServerPortConfig,
  portConfig,
  redisUrl,
} from './configs'
import {ChallengeDbService} from './db/ChallegeDbService'
import {InboxDbService} from './db/InboxDbService'
import {MessagesDbService} from './db/MessagesDbService'
import {WhitelistDbService} from './db/WhiteListDbService'
import DbLayer from './db/layer'
import {internalServerLive} from './internalServer'
import {reportMetricsLayer} from './metrics'
import {createChallenge} from './routes/challenges/createChalenge'
import {createChallenges} from './routes/challenges/createChallenges'
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
import {ChatChallengeService} from './utils/ChatChallengeService'

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
  internalServerLive,
  reportMetricsLayer,
  ServerCrypto.layer(cryptoConfig),
  healthServerLayer({port: healthServerPortConfig}),
  ChatChallengeService.Live
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

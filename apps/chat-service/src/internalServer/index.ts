import {HttpRouter} from '@effect/platform'
import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {cleanInvalidChallenges} from './routes/cleanInvalidChallenges'
import {clearExpiredMessages} from './routes/clearExpiredMessages'

export const internalServerLive = makeInternalServer(
  HttpRouter.empty.pipe(
    HttpRouter.post('/clean-invalid-challenges', cleanInvalidChallenges),
    HttpRouter.post('/clear-expired-messages', clearExpiredMessages)
  ),
  {
    port: internalServerPortConfig,
  }
)

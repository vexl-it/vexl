import {HttpRouter} from '@effect/platform'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {makeInternalServer} from '@vexl-next/server-utils/src/InternalServer'

export const internalServerLive = makeInternalServer(HttpRouter.empty, {
  port: internalServerPortConfig,
})

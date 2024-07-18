import {LogoutUserEndpoint} from '@vexl-next/rest-api/src/services/user/specification'
import {Effect} from 'effect'
import {Handler} from 'effect-http'

export const logoutUserHandler = Handler.make(LogoutUserEndpoint, () =>
  Effect.succeed('Depreciated')
)

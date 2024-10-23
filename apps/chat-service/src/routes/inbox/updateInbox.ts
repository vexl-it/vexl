import {UpdateInboxEndpoint} from '@vexl-next/rest-api/src/services/chat/specification'
import {Effect} from 'effect'
import {Handler} from 'effect-http'

// Depreciated - left here for backwards compatibility
export const updateInbox = Handler.make(UpdateInboxEndpoint, () =>
  Effect.succeed({})
)

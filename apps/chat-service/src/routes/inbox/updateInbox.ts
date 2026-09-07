import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'

// Depreciated - left here for backwards compatibility
export const updateInbox = makeHttpApiHandler(
  ChatApiSpecification,
  'Inboxes',
  'updateInbox',
  () => Effect.succeed({}).pipe(makeEndpointEffect)
)

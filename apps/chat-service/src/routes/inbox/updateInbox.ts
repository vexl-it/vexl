import {HttpApiBuilder} from '@effect/platform/index'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'

// Depreciated - left here for backwards compatibility
export const updateInbox = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'updateInbox',
  () => Effect.succeed({}).pipe(makeEndpointEffect)
)

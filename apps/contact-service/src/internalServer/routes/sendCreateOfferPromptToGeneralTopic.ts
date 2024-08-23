import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {withRedisLock} from '@vexl-next/server-utils/src/RedisService'
import {Effect} from 'effect'
import {sendNotificationToGeneralTopic} from '../../utils/notifications'

export const sendCreateOfferPromptToGeneralTopic =
  sendNotificationToGeneralTopic('CREATE_OFFER_PROMPT').pipe(
    withRedisLock('sendCreateOfferPromptToGeneralTopic', 1_000),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError(
          'Error while issuing notification for general topic',
          e
        ),
        Effect.fail(new UnexpectedServerError({status: 500, cause: e}))
      )
    ),
    Effect.withSpan('Sending create offer prompt to general topic')
  )

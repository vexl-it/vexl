import {Schema} from '@effect/schema'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {SubmitFeedbackEndpoint} from '@vexl-next/rest-api/src/services/user/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {FeedbackDbService} from './db'

export const submitFeedbackHandler = Handler.make(
  SubmitFeedbackEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const insertFeedback = yield* _(FeedbackDbService)

        yield* _(insertFeedback(req.body))
      }).pipe(
        Effect.catchAll((e) =>
          Effect.zipRight(
            Effect.log('Error while submitting feedback', e),
            Effect.fail(new UnexpectedServerError({status: 500}))
          )
        ),
        Effect.withSpan('SubmitFeedbackHandler', {attributes: {...req.body}})
      ),
      Schema.Void
    )
)

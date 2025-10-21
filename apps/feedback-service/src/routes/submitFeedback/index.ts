import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {FeedbackApiSpecification} from '@vexl-next/rest-api/src/services/feedback/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {FeedbackDbService} from './db'

export const submitFeedbackHandler = HttpApiBuilder.handler(
  FeedbackApiSpecification,
  'root',
  'submitFeedback',
  ({payload}) =>
    Effect.gen(function* (_) {
      const insertFeedback = yield* _(FeedbackDbService)

      yield* _(insertFeedback(payload))
    }).pipe(
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.log('Error while submitting feedback', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('SubmitFeedbackHandler', {attributes: {...payload}}),
      makeEndpointEffect
    )
)

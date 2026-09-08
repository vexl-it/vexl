import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {FeedbackApiSpecification} from '@vexl-next/rest-api/src/services/feedback/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {FeedbackDbService} from './db'

export const submitFeedbackHandler = makeHttpApiHandler(
  FeedbackApiSpecification,
  'root',
  'submitFeedback',
  ({payload}) =>
    Effect.gen(function* () {
      const insertFeedback = yield* FeedbackDbService

      yield* insertFeedback(payload)
    }).pipe(
      Effect.catch((e) =>
        Effect.andThen(
          Effect.log('Error while submitting feedback', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('SubmitFeedbackHandler', {attributes: {...payload}}),
      makeEndpointEffect
    )
)

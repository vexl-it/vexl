import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {FeedbackApiSpecification} from '@vexl-next/rest-api/src/services/feedback/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {Effect} from 'effect'
import {reportTradeFeedbackSubmitted} from '../../metrics'
import {FeedbackDbService} from './db'

export const submitFeedbackHandler = HttpApiBuilder.handler(
  FeedbackApiSpecification,
  'root',
  'submitFeedback',
  ({payload, headers}) =>
    Effect.gen(function* (_) {
      const upsertFeedback = yield* _(FeedbackDbService)

      const {previousStars} = yield* _(upsertFeedback(payload))

      if (
        payload.type === 'trade' &&
        payload.stars !== undefined &&
        previousStars === null
      ) {
        yield* _(
          reportTradeFeedbackSubmitted({
            positive: payload.stars >= 4,
            commonMetricAttributes: commonMetricAttributesFromHeaders(headers),
          })
        )
      }
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

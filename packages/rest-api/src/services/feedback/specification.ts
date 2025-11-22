import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  RateLimitedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {SubmitFeedbackRequest} from './contracts'

export const SubmitFeedbackEndpoint = HttpApiEndpoint.post(
  'submitFeedback',
  '/api/v1/feedback/submit'
)
  .setPayload(SubmitFeedbackRequest)
  .annotate(MaxExpectedDailyCall, 10)

export const FeedbackApiSpecification = HttpApi.make('Feedback service')
  .middleware(RateLimitingMiddleware)
  .addError(RateLimitedError)
  .add(HttpApiGroup.make('root', {topLevel: true}).add(SubmitFeedbackEndpoint))
  .addError(NotFoundError)
  .addError(UnexpectedServerError)

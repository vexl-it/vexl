import {Schema} from 'effect'
import {HttpApi, HttpApiEndpoint, HttpApiGroup} from 'effect/unstable/httpapi'
import {commonApiErrors} from '../../commonApiErrors'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {SubmitFeedbackRequest} from './contracts'

export const SubmitFeedbackEndpoint = HttpApiEndpoint.post(
  'submitFeedback',
  '/api/v1/feedback/submit',
  {
    disableCodecs: true,
    payload: Schema.Struct(SubmitFeedbackRequest.fields),
    error: Schema.Union([...commonApiErrors]),
  }
).annotate(MaxExpectedDailyCall, 10)

export const FeedbackApiSpecification = HttpApi.make('Feedback service')
  .add(HttpApiGroup.make('root', {topLevel: true}).add(SubmitFeedbackEndpoint))
  .middleware(RateLimitingMiddleware)

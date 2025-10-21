import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ServerSecurityMiddleware} from '../../apiSecurity'
import {SubmitFeedbackRequest} from './contracts'

export const SubmitFeedbackEndpoint = HttpApiEndpoint.post(
  'submitFeedback',
  '/api/v1/feedback/submit'
).setPayload(SubmitFeedbackRequest)

export const FeedbackApiSpecification = HttpApi.make('Feedback service')
  .add(
    HttpApiGroup.make('root', {topLevel: true})
      .add(SubmitFeedbackEndpoint)
      .middleware(ServerSecurityMiddleware)
  )
  .addError(NotFoundError)
  .addError(UnexpectedServerError)

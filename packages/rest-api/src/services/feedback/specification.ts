import {Api} from 'effect-http'
import {ServerSecurity} from '../../apiSecurity'
import {SubmitFeedbackRequest} from './contracts'

export const SubmitFeedbackEndpoint = Api.post(
  'submitFeedback',
  '/api/v1/feedback/submit'
).pipe(
  Api.setSecurity(ServerSecurity),
  Api.setResponseStatus(200 as const),
  Api.setRequestBody(SubmitFeedbackRequest)
)

export const FeedbackApiSpecification = Api.make({
  title: 'Feedback service',
}).pipe(Api.addEndpoint(SubmitFeedbackEndpoint))

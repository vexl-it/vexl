import {SubmitFeedbackEndpoint} from '@vexl-next/rest-api/src/services/user/specification'
import {makeRedirectHandler} from '@vexl-next/server-utils/src/makeRedirectHandler'
import {feedbackServiceUrlToRedirectToConfig} from '../configs'

export const submitFeedbackHandler = makeRedirectHandler(
  SubmitFeedbackEndpoint,
  feedbackServiceUrlToRedirectToConfig,
  308
)

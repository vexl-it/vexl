import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {CommonHeaders} from '../../commonHeaders'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {ReportNotificationInteractionRequest} from './contracts'

export const ReportNotificationInteractionEndpoint = HttpApiEndpoint.get(
  'reportNotificationInteraction',
  '/report/notification-interaction'
)
  .setHeaders(CommonHeaders)
  .setUrlParams(ReportNotificationInteractionRequest)
  .addSuccess(NoContentResponse)

const RootGroup = HttpApiGroup.make('root', {topLevel: true}).add(
  ReportNotificationInteractionEndpoint
)

export const MetricsServiceSpecification = HttpApi.make('Metrics Service')
  .add(RootGroup)
  .addError(NotFoundError)
  .addError(UnexpectedServerError)

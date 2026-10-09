import {HttpApi, HttpApiEndpoint, HttpApiGroup} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NoContentResponse} from '../../NoContentResponse.brand'

export const ReportNewUserEndpoint = HttpApiEndpoint.post(
  'reportNewUser',
  '/new-user'
).addSuccess(NoContentResponse)

export const ReportNewConnectionsEndpoint = HttpApiEndpoint.post(
  'reportNewConnections',
  '/new-connections'
).addSuccess(NoContentResponse)

const UpdatesApiGroup = HttpApiGroup.make('Updates')
  .add(ReportNewUserEndpoint)
  .add(ReportNewConnectionsEndpoint)

export const DashboardInternalApiSpecification = HttpApi.make(
  'Dashboard Internal API'
)
  .add(UpdatesApiGroup)
  .addError(UnexpectedServerError, {status: 500})

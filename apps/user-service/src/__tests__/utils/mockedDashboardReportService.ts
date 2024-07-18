import {jest} from '@jest/globals'
import {Effect, Layer} from 'effect'
import {
  type DashboardReportsOperations,
  DashboardReportsService,
} from '../../routes/login/utils/DashboardReportsService'

export const mockedReportNewUserToDashboard = jest.fn<
  DashboardReportsOperations['reportNewUserCreated']
>(() => Effect.void)

export const mockedDashboardReportService = Layer.effect(
  DashboardReportsService,
  Effect.succeed({
    reportNewUserCreated: mockedReportNewUserToDashboard,
  })
)

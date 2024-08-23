import {jest} from '@jest/globals'
import {Effect, Layer} from 'effect'
import {DashboardReportsService} from '../DashboardReportsService'

export const mockedReportNewUserCreated = jest.fn(() => Effect.void)
export const mockedReportContactsImported = jest.fn(() => Effect.void)

export const mockedDashboardReportsService = Layer.succeed(
  DashboardReportsService,
  {
    reportNewUserCreated: mockedReportNewUserCreated,
    reportContactsImported: mockedReportContactsImported,
  }
)

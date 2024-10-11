import {jest} from '@jest/globals'
import {Effect, Layer} from 'effect'
import {MetricsClientService} from '../metrics/MetricsClientService'

export const mockedReportMetric = jest.fn(() => Effect.void)

export const mockedMetricsClientService = Layer.succeed(MetricsClientService, {
  reportMetric: mockedReportMetric,
})

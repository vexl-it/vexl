import type * as Definitions from '@vexl-next/analytics-definitions/src/definitions'
import {clearTestAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from './src/__tests__/utils/runPromiseInMockedEnvironment'

// Mocked here, not per test file: the imports above already load the app and its registry.
// The test definitions are registered next to the real ones.
jest.mock('@vexl-next/analytics-definitions/src/definitions', () => ({
  analyticsDefinitions: {
    ...jest.requireActual<typeof Definitions>(
      '@vexl-next/analytics-definitions/src/definitions'
    ).analyticsDefinitions,
    ...jest.requireActual<typeof Definitions>(
      '@vexl-next/analytics-definitions/src/testDefinitions'
    ).analyticsDefinitions,
  },
}))

beforeAll(async () => {
  await startRuntime()
})

beforeEach(async () => {
  await runPromiseInMockedEnvironment(clearTestAuthHeaders)
})
afterAll(async () => {
  await disposeRuntime()
}, 60_000)

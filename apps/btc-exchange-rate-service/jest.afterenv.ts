import {clearTestAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from './src/__tests__/utils/runPromiseInMockedEnvironment'

beforeAll(async () => {
  await startRuntime()
})
afterAll(async () => {
  await disposeRuntime()
})

beforeEach(async () => {
  await runPromiseInMockedEnvironment(clearTestAuthHeaders)
})

import {clearTestAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from './src/__tests__/utils/runPromiseInMockedEnvironment'

beforeAll(async () => {
  await startRuntime()
})

beforeEach(async () => {
  await runPromiseInMockedEnvironment(clearTestAuthHeaders)
})
afterAll(async () => {
  await disposeRuntime()
}, 60_000)

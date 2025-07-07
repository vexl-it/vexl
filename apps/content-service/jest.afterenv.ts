import {
  disposeRuntime,
  startRuntime,
} from './src/__tests__/utils/runPromiseInMockedEnvironment'

beforeAll(async () => {
  await startRuntime()
})

afterAll(async () => {
  await disposeRuntime()
}, 60_000)

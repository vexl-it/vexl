import {clearTestAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from './src/__tests__/utils/runPromiseInMockedEnvironment'

beforeAll(async () => {
  await startRuntime()
})

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      yield* clearTestAuthHeaders
      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM club_member_count_change`
    })
  )
})

afterAll(async () => {
  await disposeRuntime()
}, 60_000)

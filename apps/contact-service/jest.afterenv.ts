import {SqlClient} from '@effect/sql'
import {clearTestAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
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
    Effect.gen(function* (_) {
      yield* _(clearTestAuthHeaders)
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM club_member_count_change`)
    })
  )
})

afterAll(async () => {
  await disposeRuntime()
}, 60_000)

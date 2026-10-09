import {HttpBody, HttpClient} from '@effect/platform'
import {InternalServerTestClient} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const ADMIN_PATHS = [
  '/api/v1/clubs/admin',
  '/api/v1/clubs/admin/stats',
  '/test-hashing-speed',
]

describe('Internal endpoints', () => {
  it('are not served by the public server', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const publicClient = yield* _(HttpClient.HttpClient)
        for (const path of ADMIN_PATHS) {
          const response = yield* _(publicClient.get(path))
          expect(response.status).toBe(404)
        }
      })
    )
  })

  it('are served by the internal server', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalClient = yield* _(InternalServerTestClient)
        const listClubsResponse = yield* _(
          internalClient.get('/api/v1/clubs/admin', {
            headers: {'x-admin-token': 'bad-token'},
          })
        )
        expect(listClubsResponse.status).toBe(401)

        const hashingSpeedResponse = yield* _(
          internalClient.post('/test-hashing-speed', {
            headers: {'x-admin-token': 'bad-token'},
            body: HttpBody.unsafeJson({iterations: 1, numberOfElements: 1}),
          })
        )
        expect(hashingSpeedResponse.status).toBe(401)
      })
    )
  })
})

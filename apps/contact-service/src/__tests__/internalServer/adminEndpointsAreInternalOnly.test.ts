import {HttpBody, HttpClient, HttpClientRequest} from '@effect/platform'
import {InternalServerTestClient} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, pipe} from 'effect'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

// Valid requests with a wrong token: a leaked route would answer 401, not 404.
const INTERNAL_REQUESTS = pipe(
  [
    HttpClientRequest.get('/api/v1/clubs/admin'),
    HttpClientRequest.get('/api/v1/clubs/admin/stats'),
    HttpClientRequest.post('/test-hashing-speed').pipe(
      HttpClientRequest.bodyUnsafeJson({iterations: 1, numberOfElements: 1})
    ),
  ],
  Array.map(HttpClientRequest.setHeader('x-admin-token', 'bad-token'))
)

describe('Internal endpoints', () => {
  it('are not served by the public server', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const publicClient = yield* _(HttpClient.HttpClient)
        for (const request of INTERNAL_REQUESTS) {
          const response = yield* _(publicClient.execute(request))
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

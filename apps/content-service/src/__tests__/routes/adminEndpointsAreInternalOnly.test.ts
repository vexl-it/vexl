import {HttpClient} from '@effect/platform'
import {InternalServerTestClient} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const ADMIN_PATHS = [
  '/content/clear-cache',
  '/content/vexl-product-notifications/admin',
]

describe('Internal endpoints', () => {
  it('are not served by the public server', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const publicClient = yield* _(HttpClient.HttpClient)
        for (const path of ADMIN_PATHS) {
          const response = yield* _(publicClient.post(path))
          expect(response.status).toBe(404)
        }
      })
    )
  })

  it('are served by the internal server', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalClient = yield* _(InternalServerTestClient)
        const response = yield* _(
          internalClient.post('/content/clear-cache', {
            headers: {'x-admin-token': 'bad-token'},
          })
        )
        expect(response.status).toBe(401)
      })
    )
  })
})

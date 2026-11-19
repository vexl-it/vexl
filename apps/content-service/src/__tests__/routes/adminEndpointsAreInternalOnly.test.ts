import {HttpClient} from '@effect/platform'
import {InternalServerTestClient} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {TEST_ADMIN_TOKEN} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const ADMIN_PATHS = [
  '/content/vexl-product-notifications/admin',
  '/content/admin/blog-posts',
  '/content/admin/events',
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

  it('are served by the internal server behind the admin token', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const internalClient = yield* _(InternalServerTestClient)
        const badTokenResponse = yield* _(
          internalClient.get('/content/admin/blog-posts', {
            headers: {'x-admin-token': 'bad-token'},
          })
        )
        expect(badTokenResponse.status).toBe(401)

        const legacyUrlTokenResponse = yield* _(
          internalClient.get('/content/admin/blog-posts', {
            urlParams: {adminToken: TEST_ADMIN_TOKEN},
          })
        )
        expect(legacyUrlTokenResponse.status).toBe(401)

        const validTokenResponse = yield* _(
          internalClient.get('/content/admin/blog-posts', {
            headers: {'x-admin-token': TEST_ADMIN_TOKEN},
          })
        )
        expect(validTokenResponse.status).toBe(200)
      })
    )
  })
})

import {SqlClient} from '@effect/sql/SqlClient'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Order, pipe, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
  type DummyUser,
} from './utils'

let networkOne: [DummyUser, ...DummyUser[]]
let networkTwo: [DummyUser, ...DummyUser[]]

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      networkOne = yield* _(
        Effect.all([
          generateKeysAndHasheForNumber('+420733333001'),
          generateKeysAndHasheForNumber('+420733333002'),
          generateKeysAndHasheForNumber('+420733333003'),
          generateKeysAndHasheForNumber('+420733333004'),
          generateKeysAndHasheForNumber('+420733333005'),
        ])
      )

      yield* _(
        Effect.forEach(networkOne, (oneUser) =>
          createAndImportUsersFromNetwork(oneUser, networkOne)
        )
      )

      networkTwo = yield* _(
        Effect.all([
          generateKeysAndHasheForNumber('+420733333101'),
          generateKeysAndHasheForNumber('+420733333102'),
          generateKeysAndHasheForNumber('+420733333106'),
          generateKeysAndHasheForNumber('+420733333107'),
          generateKeysAndHasheForNumber('+420733333108'),
        ])
      )

      yield* _(
        Effect.forEach(networkTwo, (twoUser) =>
          createAndImportUsersFromNetwork(twoUser, [...networkOne])
        )
      )
    })
  )
})

describe('Fetch my contacts paginated', () => {
  it('Properly fetches first level contacts (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]

        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )
        const app = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(me.authHeaders))

        const PAGE_SIZE = 4
        const {items} = yield* _(
          app.Contact.fetchMyContactsPaginated({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              'vexl-app-meta':
                '{"appSource":"Some test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
            urlParams: {level: 'FIRST' as const, limit: PAGE_SIZE},
          })
        )

        const sql = yield* _(SqlClient)

        const userInDb = yield* _(sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${me.keys.publicKeyPemBase64}
        `)
        expect(userInDb).toHaveLength(1)
        expect(userInDb[0]).toHaveProperty('appSource', 'Some test')

        expect(pipe(items, Array.sort(Order.string), Array.join(','))).toBe(
          pipe(
            userContacts,
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })

  it('Properly fetches second level contacts (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        const app = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(me.authHeaders))

        const PAGE_SIZE = 20
        const {items} = yield* _(
          app.Contact.fetchMyContactsPaginated({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              'vexl-app-meta':
                '{"appSource":"googlePlay", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
            urlParams: {
              level: 'SECOND' as const,
              limit: PAGE_SIZE,
            },
          })
        )

        expect(pipe(items, Array.sort(Order.string), Array.join(','))).toBe(
          pipe(
            [...networkTwo, ...userContacts],
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(',')
          )
        )
      })
    )
  })

  it('Returns correct pagination metadata for FIRST level', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const result = yield* _(
          app.Contact.fetchMyContactsPaginated({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              'vexl-app-meta':
                '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
            urlParams: {level: 'FIRST' as const, limit: 2},
          })
        )

        expect(result.limit).toBe(2)
        expect(result.items.length).toBeLessThanOrEqual(2)
        expect(typeof result.hasNext).toBe('boolean')
        if (result.hasNext) {
          expect(result.nextPageToken).toBeTruthy()
          expect(typeof result.nextPageToken).toBe('string')
        } else {
          expect(result.nextPageToken).toBeNull()
        }
      })
    )
  })

  it('Handles pagination with nextPageToken correctly for FIRST level', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const headers = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const firstPage = yield* _(
          app.Contact.fetchMyContactsPaginated({
            headers,
            urlParams: {level: 'FIRST' as const, limit: 2},
          })
        )

        if (firstPage.hasNext && firstPage.nextPageToken) {
          const secondPage = yield* _(
            app.Contact.fetchMyContactsPaginated({
              headers,
              urlParams: {
                level: 'FIRST' as const,
                limit: 2,
                nextPageToken: firstPage.nextPageToken,
              },
            })
          )

          // Ensure no duplicates between pages
          const intersection = Array.intersection(
            firstPage.items,
            secondPage.items
          )
          expect(intersection.length).toBe(0)

          expect(secondPage.nextPageToken).not.toBe(firstPage.nextPageToken)
        }
      })
    )
  })

  it('Handles invalid nextPageToken', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const response = yield* _(
          app.Contact.fetchMyContactsPaginated({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              'vexl-app-meta':
                '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
            }),
            urlParams: {
              level: 'FIRST' as const,
              limit: 10,
              nextPageToken: 'invalid',
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidNextPageTokenError)(response)
      })
    )
  })

  it('Handles limit 0 correctly for all levels', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const headers = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        // FIRST level with limit 0
        const firstResult = yield* _(
          app.Contact.fetchMyContactsPaginated({
            headers,
            urlParams: {level: 'FIRST' as const, limit: 0},
          })
        )

        expect(firstResult.items).toEqual([])
        expect(firstResult.limit).toBe(0)
        expect(firstResult.hasNext).toBe(false)
        expect(firstResult.nextPageToken).toBeNull()

        // SECOND level with limit 0
        const secondResult = yield* _(
          app.Contact.fetchMyContactsPaginated({
            headers,
            urlParams: {level: 'SECOND' as const, limit: 0},
          })
        )

        expect(secondResult.items).toEqual([])
        expect(secondResult.limit).toBe(0)
        expect(secondResult.hasNext).toBe(false)
        expect(secondResult.nextPageToken).toBeNull()
      })
    )
  })

  it('Returns consistent results across multiple calls with same parameters', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const urlParams = {level: 'FIRST' as const, limit: 10}
        const headers = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const [firstCall, secondCall] = yield* _(
          Effect.all([
            app.Contact.fetchMyContactsPaginated({headers, urlParams}),
            app.Contact.fetchMyContactsPaginated({headers, urlParams}),
          ])
        )

        expect(firstCall.items).toEqual(secondCall.items)
        expect(firstCall.hasNext).toBe(secondCall.hasNext)
        expect(firstCall.nextPageToken).toBe(secondCall.nextPageToken)
        expect(firstCall.limit).toBe(secondCall.limit)
      })
    )
  })

  it('Does not return own public key in results', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const me = networkOne[0]
        const app = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(me.authHeaders))

        const headers = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const levels: Array<'FIRST' | 'SECOND'> = ['FIRST', 'SECOND']

        for (const level of levels) {
          const urlParams = {level, limit: 50}

          const result = yield* _(
            app.Contact.fetchMyContactsPaginated({
              headers,
              urlParams,
            })
          )

          expect(result.items).not.toContain(me.keys.publicKeyPemBase64)
        }
      })
    )
  })
})

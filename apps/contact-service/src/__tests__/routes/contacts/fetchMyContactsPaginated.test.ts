import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Order, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql/SqlClient'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  createUserOnNetwork,
  generateKeysAndHasheForNumber,
  importUsersFromNetwork,
  makeTestCommonAndSecurityHeaders,
  withPublicImportCountThreshold,
  type DummyUser,
} from './utils'

let networkOne: [DummyUser, ...DummyUser[]]
let networkTwo: [DummyUser, ...DummyUser[]]
let networkThree: [DummyUser, ...DummyUser[]]

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      networkOne = yield* Effect.all([
        generateKeysAndHasheForNumber('+420733333001'),
        generateKeysAndHasheForNumber('+420733333002'),
        generateKeysAndHasheForNumber('+420733333003'),
      ])

      yield* Effect.forEach(networkOne, (oneUser) =>
        createAndImportUsersFromNetwork(oneUser, networkOne)
      )

      networkThree = yield* Effect.all([
        generateKeysAndHasheForNumber('+420733333301'),
      ])

      yield* Effect.forEach(networkThree, (threeUser) =>
        createUserOnNetwork(threeUser)
      )

      networkTwo = yield* Effect.all([
        generateKeysAndHasheForNumber('+420733333101'),
        generateKeysAndHasheForNumber('+420733333102'),
      ])

      yield* Effect.forEach(networkTwo, (twoUser) =>
        createAndImportUsersFromNetwork(twoUser, networkOne)
      )
    })
  )
})

describe('Fetch my contacts paginated', () => {
  it('Properly fetches first level contacts (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]

        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )
        const app = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"Some test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const PAGE_SIZE = 4
        const {items} = yield* app.Contact.fetchMyContactsPaginated({
          headers: commonAndSecurityHeaders,
          query: {level: 'FIRST' as const, limit: PAGE_SIZE},
        })

        const sql = yield* SqlClient

        const userInDb = yield* sql`
          SELECT
            *
          FROM
            users
          WHERE
            public_key = ${me.keys.publicKeyPemBase64}
        `
        expect(userInDb).toHaveLength(1)
        expect(userInDb[0]).toHaveProperty('appSource', 'Some test')

        expect(pipe(items, Array.sort(Order.String), Array.join(','))).toBe(
          pipe(
            userContacts,
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.String),
            Array.join(',')
          )
        )
      })
    )
  })

  it('Properly fetches second level contacts (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        const app = yield* NodeTestingApp

        yield* setAuthHeaders(me.authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"googlePlay", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const PAGE_SIZE = 20
        const response = yield* app.Contact.fetchMyContactsPaginated({
          headers: commonAndSecurityHeaders,
          query: {
            level: 'SECOND' as const,
            limit: PAGE_SIZE,
          },
        })

        expect(
          pipe(response.items, Array.sort(Order.String), Array.join(','))
        ).toBe(
          pipe(
            [...networkTwo, ...userContacts],
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.String),
            Array.join(',')
          )
        )

        // let's add new second level contacts for already created user in between fetching pages
        yield* Effect.forEach(networkThree, (threeUser) =>
          importUsersFromNetwork(threeUser, networkOne)
        )

        yield* setAuthHeaders(me.authHeaders)

        const secondPageResponse = yield* app.Contact.fetchMyContactsPaginated({
          headers: commonAndSecurityHeaders,
          query: {
            level: 'SECOND' as const,
            limit: PAGE_SIZE,
            nextPageToken: response.nextPageToken ?? undefined,
          },
        })

        expect(
          pipe(
            secondPageResponse.items,
            Array.sort(Order.String),
            Array.join(',')
          )
        ).toBe(
          pipe(
            networkThree,
            Array.map((one) => one.keys.publicKeyPemBase64),
            Array.sort(Order.String),
            Array.join(',')
          )
        )
      })
    )
  })

  it('Filters second level contacts connected only through unregistered public imported numbers', async () => {
    await withPublicImportCountThreshold(2, async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const alice = yield* generateKeysAndHasheForNumber('+420733666001')
          const bob = yield* generateKeysAndHasheForNumber('+420733666002')
          const extraImporter =
            yield* generateKeysAndHasheForNumber('+420733666003')
          const publicNumber =
            yield* generateKeysAndHasheForNumber('+420733666004')

          yield* createUserOnNetwork(alice)
          yield* createUserOnNetwork(bob)
          yield* createUserOnNetwork(extraImporter)

          yield* importUsersFromNetwork(alice, [publicNumber])
          yield* importUsersFromNetwork(bob, [publicNumber])
          yield* importUsersFromNetwork(extraImporter, [publicNumber])

          const app = yield* NodeTestingApp
          yield* setAuthHeaders(alice.authHeaders)
          const headers = makeTestCommonAndSecurityHeaders(alice.authHeaders)
          const secondLevel = 'SECOND'

          const response = yield* app.Contact.fetchMyContactsPaginated({
            headers,
            query: {
              level: secondLevel,
              limit: 20,
            },
          })

          expect(response.items).not.toContain(bob.keys.publicKeyPemBase64)
          expect(response.items).not.toContain(
            extraImporter.keys.publicKeyPemBase64
          )
        })
      )
    })
  })

  it('Returns correct pagination metadata for FIRST level', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]
        const app = yield* NodeTestingApp
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )
        yield* setAuthHeaders(me.authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const limit = 20
        const result = yield* app.Contact.fetchMyContactsPaginated({
          headers: commonAndSecurityHeaders,
          query: {level: 'FIRST' as const, limit},
        })

        expect(result.limit).toBe(limit)
        expect(result.items.length).toBeLessThanOrEqual(userContacts.length)
        expect(result.hasNext).toBe(userContacts.length > limit)
        expect(result.nextPageToken).not.toBeNull()
      })
    )
  })

  it('Handles pagination with nextPageToken correctly for FIRST level', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]
        const app = yield* NodeTestingApp
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )
        yield* setAuthHeaders(me.authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const headers = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const limit = userContacts.length > 2 ? 2 : userContacts.length
        const firstPage = yield* app.Contact.fetchMyContactsPaginated({
          headers,
          query: {level: 'FIRST' as const, limit},
        })

        if (firstPage.hasNext && firstPage.nextPageToken) {
          const secondPage = yield* app.Contact.fetchMyContactsPaginated({
            headers,
            query: {
              level: 'FIRST' as const,
              limit,
              nextPageToken: firstPage.nextPageToken,
            },
          })

          expect(secondPage.nextPageToken).not.toBe(firstPage.nextPageToken)
        }
      })
    )
  })

  it('Handles invalid nextPageToken', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const response = yield* pipe(
          app.Contact.fetchMyContactsPaginated({
            headers: commonAndSecurityHeaders,
            query: {
              level: 'FIRST' as const,
              limit: 10,
              nextPageToken: 'invalid',
            },
          }),
          Effect.result
        )

        expectErrorResponse(InvalidNextPageTokenError)(response)
      })
    )
  })

  it('Handles limit 0 correctly for all levels', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const headers = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const firstResult = yield* app.Contact.fetchMyContactsPaginated({
          headers,
          query: {level: 'FIRST' as const, limit: 0},
        })

        expect(firstResult.items).toEqual([])
        expect(firstResult.limit).toBe(0)
        expect(firstResult.hasNext).toBe(false)
        expect(firstResult.nextPageToken).toBeNull()

        const secondResult = yield* app.Contact.fetchMyContactsPaginated({
          headers,
          query: {level: 'SECOND' as const, limit: 0},
        })

        expect(secondResult.items).toEqual([])
        expect(secondResult.limit).toBe(0)
        expect(secondResult.hasNext).toBe(false)
        expect(secondResult.nextPageToken).toBeNull()
      })
    )
  })

  it('Returns consistent results across multiple calls with same parameters', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)

        const query = {level: 'FIRST' as const, limit: 10}
        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const headers = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const [firstCall, secondCall] = yield* Effect.all([
          app.Contact.fetchMyContactsPaginated({headers, query}),
          app.Contact.fetchMyContactsPaginated({headers, query}),
        ])

        expect(firstCall.items).toEqual(secondCall.items)
        expect(firstCall.hasNext).toBe(secondCall.hasNext)
        expect(firstCall.nextPageToken).toBe(secondCall.nextPageToken)
        expect(firstCall.limit).toBe(secondCall.limit)
      })
    )
  })

  it('Does not return own public key in results', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]
        const app = yield* NodeTestingApp
        yield* setAuthHeaders(me.authHeaders)

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })

        const headers = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const levels: Array<'FIRST' | 'SECOND'> = ['FIRST', 'SECOND']

        for (const level of levels) {
          const query = {level, limit: 50}

          const result = yield* app.Contact.fetchMyContactsPaginated({
            headers,
            query,
          })

          expect(result.items).not.toContain(me.keys.publicKeyPemBase64)
        }
      })
    )
  })

  it('Does not return inactive contacts when active window filter is enabled', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const me = networkOne[0]
        const inactiveContact = networkOne[1]
        const app = yield* NodeTestingApp
        const sql = yield* SqlClient

        yield* sql`
          UPDATE users
          SET
            refreshed_at = CURRENT_DATE - 180
          WHERE
            public_key = ${inactiveContact.keys.publicKeyPemBase64}
        `

        const testCommonHeaders = Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          'vexl-app-meta':
            '{"appSource":"test", "versionCode": 1, "platform":"ANDROID", "semver": "1.0.0", "language": "en", "isDeveloper": false}',
        })
        const headers = makeTestCommonAndSecurityHeaders(
          me.authHeaders,
          testCommonHeaders
        )

        const result = yield* pipe(
          app.Contact.fetchMyContactsPaginated({
            headers,
            query: {level: 'FIRST' as const, limit: 50},
          }),
          Effect.ensuring(
            Effect.ignore(sql`
              UPDATE users
              SET
                refreshed_at = CURRENT_DATE
              WHERE
                public_key = ${inactiveContact.keys.publicKeyPemBase64}
            `)
          )
        )

        expect(result.items).not.toContain(
          inactiveContact.keys.publicKeyPemBase64
        )
      })
    )
  })
})

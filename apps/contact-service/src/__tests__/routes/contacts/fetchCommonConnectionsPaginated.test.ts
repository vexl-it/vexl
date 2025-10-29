import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Order, pipe} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  generateKeysAndHasheForNumber,
  type DummyUser,
} from './utils'

let networkOne: [DummyUser, ...DummyUser[]]

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
    })
  )
})

describe('Common connections paginated', () => {
  it('Fetches common connections for array of friends (paginated)', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: 20,
            },
          })
        )

        const resultKeys = pipe(
          connections.items,
          Array.map((c) => c.publicKey),
          Array.sort(Order.string),
          Array.join(', ')
        )

        expect(resultKeys).toBe(
          pipe(
            userContacts,
            Array.map((o) => o.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(', ')
          )
        )

        // Each friend should have other people as common friends
        for (const {common, publicKey} of connections.items) {
          const otherFriendsHashes = pipe(
            userContacts,
            Array.filter((o) => o.keys.publicKeyPemBase64 !== publicKey),
            Array.map((o) => o.hashedNumber),
            Array.sort(Order.string),
            Array.join(',')
          )

          expect(
            pipe(common.hashes, Array.sort(Order.string), Array.join(','))
          ).toEqual(otherFriendsHashes)
        }
      })
    )
  })

  it('Returns correct pagination metadata', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: 2,
            },
          })
        )

        expect(connections.limit).toBe(2)
        expect(connections.items.length).toBeLessThanOrEqual(2)
        expect(typeof connections.hasNext).toBe('boolean')
        expect(connections.nextPageToken).toEqual(
          expect.any(
            connections.hasNext
              ? String
              : connections.nextPageToken?.constructor
          )
        )
      })
    )
  })

  it('Handles pagination with nextPageToken correctly', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const LIMIT_PER_PAGE = 2

        const firstPage = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: LIMIT_PER_PAGE,
            },
          })
        )

        if (firstPage.hasNext && firstPage.nextPageToken) {
          const secondPage = yield* _(
            app.Contact.fetchCommonConnectionsPaginated({
              payload: {
                publicKeys: Array.map(
                  userContacts,
                  (one) => one.keys.publicKeyPemBase64
                ),
                limit: LIMIT_PER_PAGE,
                nextPageToken: firstPage.nextPageToken,
              },
            })
          )

          // No duplicates between pages
          const firstPageKeys = Array.map(
            firstPage.items,
            (item) => item.publicKey
          )
          const secondPageKeys = Array.map(
            secondPage.items,
            (item) => item.publicKey
          )

          const intersection = Array.intersection(firstPageKeys, secondPageKeys)
          expect(intersection.length).toBe(0)

          expect(secondPage.nextPageToken).not.toBe(firstPage.nextPageToken)

          const resultConnections = [...firstPage.items, ...secondPage.items]

          const resultKeys = pipe(
            resultConnections,
            Array.map((c) => c.publicKey),
            Array.sort(Order.string),
            Array.join(', ')
          )

          expect(resultKeys).toBe(
            pipe(
              userContacts,
              Array.map((o) => o.keys.publicKeyPemBase64),
              Array.sort(Order.string),
              Array.join(', ')
            )
          )

          // Each friend should have other people as common friends
          for (const {common, publicKey} of resultConnections) {
            const otherFriendsHashes = pipe(
              userContacts,
              Array.filter((o) => o.keys.publicKeyPemBase64 !== publicKey),
              Array.map((o) => o.hashedNumber),
              Array.sort(Order.string),
              Array.join(',')
            )

            expect(
              pipe(common.hashes, Array.sort(Order.string), Array.join(','))
            ).toEqual(otherFriendsHashes)
          }
        }
      })
    )
  })

  it('Returns empty array when no common connections exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const me = networkOne[0]

        yield* _(setAuthHeaders(me.authHeaders))

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: [generatePrivateKey().publicKeyPemBase64],
              limit: 20,
            },
          })
        )

        expect(connections.items).toEqual([])
        expect(connections.hasNext).toBe(false)
        expect(connections.nextPageToken).toBeNull()
        expect(connections.limit).toBe(20)
      })
    )
  })

  it('Handles invalid nextPageToken', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const response = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: 20,
              nextPageToken: 'invalid',
            },
          }),
          Effect.either
        )

        expectErrorResponse(InvalidNextPageTokenError)(response)
      })
    )
  })

  it('Returns consistent results across multiple calls with same parameters', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const payload = {
          publicKeys: Array.map(
            userContacts,
            (one) => one.keys.publicKeyPemBase64
          ),
          limit: 20,
        }

        const [firstCall, secondCall] = yield* _(
          Effect.all([
            app.Contact.fetchCommonConnectionsPaginated({payload}),
            app.Contact.fetchCommonConnectionsPaginated({payload}),
          ])
        )

        expect(firstCall.items).toEqual(secondCall.items)
        expect(firstCall.hasNext).toBe(secondCall.hasNext)
        expect(firstCall.nextPageToken).toBe(secondCall.nextPageToken)
      })
    )
  })

  it('Handles edge case with limit 0', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: 0,
            },
          })
        )

        expect(connections.items).toEqual([])
        expect(connections.limit).toBe(0)
        expect(connections.hasNext).toBe(false)
        expect(connections.nextPageToken).toBeNull()
      })
    )
  })
})

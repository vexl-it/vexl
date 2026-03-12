import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateKeyPair} from '@vexl-next/cryptography/src/operations/cryptobox'
import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {makeCommonAndSecurityHeaders} from '@vexl-next/rest-api/src/apiSecurity'
import {
  UserDataShape,
  VexlAuthHeader,
} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, Option, Order, pipe, Schema} from 'effect'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {
  commonHeaders,
  createAndImportUsersFromNetwork,
  createUserOnNetwork,
  generateKeysAndHasheForNumber,
  importUsersFromNetwork,
  makeTestCommonAndSecurityHeaders,
  type DummyUser,
} from './utils'

let networkOne: [DummyUser, ...DummyUser[]]
type PublicKeyV2KeyPair = Awaited<ReturnType<typeof generateKeyPair>>
const networkOnePublicKeyV2ByPublicKey = new Map<string, PublicKeyV2KeyPair>()

const getPublicKeyV2ForUser = (user: DummyUser): PublicKeyV2KeyPair => {
  const publicKeyV2 = networkOnePublicKeyV2ByPublicKey.get(
    user.keys.publicKeyPemBase64
  )

  if (!publicKeyV2) {
    throw new Error(
      `Missing publicKeyV2 for user ${user.keys.publicKeyPemBase64}`
    )
  }

  return publicKeyV2
}

const createVexlAuthHeader = ({
  hash,
  publicKeyV2,
}: {
  hash: DummyUser['authHeaders']['hash']
  publicKeyV2: PublicKeyV2KeyPair['publicKey']
}): Effect.Effect<typeof VexlAuthHeader.Type, unknown, ServerCrypto> =>
  Effect.gen(function* (_) {
    const crypto = yield* _(ServerCrypto)
    const encodedData = yield* _(
      Schema.encode(UserDataShape)({
        hash,
        pk: publicKeyV2,
      })
    )

    const signature = yield* _(crypto.cryptoBoxSign(encodedData))
    return yield* _(
      Schema.decode(VexlAuthHeader)(`VexlAuth ${encodedData}.${signature}`)
    )
  })

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const app = yield* _(NodeTestingApp)
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

      yield* _(
        Effect.forEach(networkOne, (oneUser) =>
          Effect.gen(function* (_) {
            const publicKeyV2 = yield* _(
              Effect.promise(async () => await generateKeyPair())
            )
            networkOnePublicKeyV2ByPublicKey.set(
              oneUser.keys.publicKeyPemBase64,
              publicKeyV2
            )

            yield* _(setAuthHeaders(oneUser.authHeaders))
            const authorization = yield* _(
              createVexlAuthHeader({
                hash: oneUser.authHeaders.hash,
                publicKeyV2: publicKeyV2.publicKey,
              })
            )
            const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
              () => ({
                publicKey: oneUser.authHeaders['public-key'],
                hash: oneUser.authHeaders.hash,
                signature: oneUser.authHeaders.signature,
                vexlAuthHeader: authorization,
              }),
              commonHeaders
            )

            yield* _(
              app.User.refreshUser({
                payload: {
                  offersAlive: true,
                  vexlNotificationToken: Option.none(),
                },
                headers: commonAndSecurityHeaders,
              })
            )
          })
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
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
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
            Array.map((o) => o.serverHashedNumberForClient),
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
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: 2,
            },
            headers: commonAndSecurityHeaders,
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

  it('Fetches common connections for array of friends by publicKeyV2', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => getPublicKeyV2ForUser(one).publicKey
              ),
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
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

        for (const {common, publicKey} of connections.items) {
          const otherFriendsHashes = pipe(
            userContacts,
            Array.filter((o) => o.keys.publicKeyPemBase64 !== publicKey),
            Array.map((o) => o.serverHashedNumberForClient),
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

  it('Ignores requester publicKeyV2 in payload when caller provides VexlAuth header', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)
        const me = networkOne[0]
        const mePublicKeyV2 = getPublicKeyV2ForUser(me)
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))
        const authorization = yield* _(
          createVexlAuthHeader({
            hash: me.authHeaders.hash,
            publicKeyV2: mePublicKeyV2.publicKey,
          })
        )

        const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
          () => ({
            publicKey: me.authHeaders['public-key'],
            hash: me.authHeaders.hash,
            signature: me.authHeaders.signature,
            vexlAuthHeader: authorization,
          }),
          commonHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: [
                ...Array.map(
                  userContacts,
                  (one) => getPublicKeyV2ForUser(one).publicKey
                ),
                mePublicKeyV2.publicKey,
              ],
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const meIsInResults = pipe(
          connections.items,
          Array.filter((item) => item.publicKey === me.keys.publicKeyPemBase64),
          Array.isNonEmptyArray
        )

        expect(meIsInResults).toBe(false)
        expect(
          pipe(
            connections.items,
            Array.map((item) => item.publicKey),
            Array.sort(Order.string),
            Array.join(', ')
          )
        ).toBe(
          pipe(
            userContacts,
            Array.map((o) => o.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(', ')
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
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

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
            headers: commonAndSecurityHeaders,
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
              headers: commonAndSecurityHeaders,
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
              Array.map((o) => o.serverHashedNumberForClient),
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
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: [generatePrivateKey().publicKeyPemBase64],
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
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
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

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
            headers: commonAndSecurityHeaders,
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
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const payload = {
          publicKeys: Array.map(
            userContacts,
            (one) => one.keys.publicKeyPemBase64
          ),
          limit: 20,
        }

        const [firstCall, secondCall] = yield* _(
          Effect.all([
            app.Contact.fetchCommonConnectionsPaginated({
              payload,
              headers: commonAndSecurityHeaders,
            }),
            app.Contact.fetchCommonConnectionsPaginated({
              payload,
              headers: commonAndSecurityHeaders,
            }),
          ])
        )

        expect(firstCall.items).toEqual(secondCall.items)
        expect(firstCall.hasNext).toBe(secondCall.hasNext)
        expect(firstCall.nextPageToken).toBe(secondCall.nextPageToken)
      })
    )
  })

  it('verifiedHashes equals hashes when all contacts are bidirectional', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        yield* _(setAuthHeaders(me.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        for (const {common} of connections.items) {
          expect(
            pipe(
              common.verifiedHashes,
              Array.sort(Order.string),
              Array.join(',')
            )
          ).toEqual(
            pipe(common.hashes, Array.sort(Order.string), Array.join(','))
          )
        }
      })
    )
  })

  it('verifiedHashes excludes common contacts that did not import both sides', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        // Create an asymmetric network:
        // alice, bob, charlie where:
        // - alice imports bob and charlie
        // - bob imports alice and charlie
        // - charlie imports alice only (NOT bob)
        //
        // When alice asks for common friends with bob:
        //   common.hashes should include charlie (both alice and bob imported charlie)
        //   common.verifiedHashes should NOT include charlie
        //     because charlie did not import bob (charlie → bob is missing)

        const alice = yield* _(generateKeysAndHasheForNumber('+420733444001'))
        const bob = yield* _(generateKeysAndHasheForNumber('+420733444002'))
        const charlie = yield* _(generateKeysAndHasheForNumber('+420733444003'))

        // Create all users
        yield* _(createUserOnNetwork(alice))
        yield* _(createUserOnNetwork(bob))
        yield* _(createUserOnNetwork(charlie))

        // alice imports bob and charlie
        yield* _(importUsersFromNetwork(alice, [bob, charlie]))
        // bob imports alice and charlie
        yield* _(importUsersFromNetwork(bob, [alice, charlie]))
        // charlie imports alice only
        yield* _(importUsersFromNetwork(charlie, [alice]))

        yield* _(setAuthHeaders(alice.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          alice.authHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: [bob.keys.publicKeyPemBase64],
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        expect(connections.items.length).toBe(1)
        const bobResult = connections.items[0]

        // charlie should be in common.hashes (both alice and bob imported charlie)
        expect(bobResult.common.hashes).toContain(
          charlie.serverHashedNumberForClient
        )

        // charlie should NOT be in verifiedHashes
        // because charlie did not import bob
        expect(bobResult.common.verifiedHashes).not.toContain(
          charlie.serverHashedNumberForClient
        )
        expect(bobResult.common.verifiedHashes).toEqual([])
      })
    )
  })

  it('verifiedHashes includes only contacts that imported both sides', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        // Network:
        // alice, bob, charlie, dave where:
        // - alice imports bob, charlie, dave
        // - bob imports alice, charlie, dave
        // - charlie imports alice and bob (bidirectional with both)
        // - dave imports alice only (NOT bob)
        //
        // When alice asks for common friends with bob:
        //   hashes: charlie, dave (both alice and bob imported them)
        //   verifiedHashes: charlie only (charlie imported both alice and bob)
        //   dave is NOT verified (dave did not import bob)

        const alice = yield* _(generateKeysAndHasheForNumber('+420733555001'))
        const bob = yield* _(generateKeysAndHasheForNumber('+420733555002'))
        const charlie = yield* _(generateKeysAndHasheForNumber('+420733555003'))
        const dave = yield* _(generateKeysAndHasheForNumber('+420733555004'))

        yield* _(createUserOnNetwork(alice))
        yield* _(createUserOnNetwork(bob))
        yield* _(createUserOnNetwork(charlie))
        yield* _(createUserOnNetwork(dave))

        yield* _(importUsersFromNetwork(alice, [bob, charlie, dave]))
        yield* _(importUsersFromNetwork(bob, [alice, charlie, dave]))
        yield* _(importUsersFromNetwork(charlie, [alice, bob]))
        yield* _(importUsersFromNetwork(dave, [alice]))

        yield* _(setAuthHeaders(alice.authHeaders))
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          alice.authHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: [bob.keys.publicKeyPemBase64],
              limit: 20,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        expect(connections.items.length).toBe(1)
        const bobResult = connections.items[0]

        // Both charlie and dave should be in hashes
        const sortedHashes = pipe(
          bobResult.common.hashes,
          Array.sort(Order.string)
        )
        const expectedHashes = pipe(
          [
            charlie.serverHashedNumberForClient,
            dave.serverHashedNumberForClient,
          ],
          Array.sort(Order.string)
        )
        expect(sortedHashes).toEqual(expectedHashes)

        // Only charlie should be in verifiedHashes
        expect(bobResult.common.verifiedHashes).toEqual([
          charlie.serverHashedNumberForClient,
        ])
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
        const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
          me.authHeaders
        )

        const connections = yield* _(
          app.Contact.fetchCommonConnectionsPaginated({
            payload: {
              publicKeys: Array.map(
                userContacts,
                (one) => one.keys.publicKeyPemBase64
              ),
              limit: 0,
            },
            headers: commonAndSecurityHeaders,
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

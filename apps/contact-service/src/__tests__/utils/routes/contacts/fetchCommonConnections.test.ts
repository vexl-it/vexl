import {HttpClientRequest} from '@effect/platform'
import {Array, Effect, Order, pipe} from 'effect'
import {NodeTestingApp} from '../../NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../runPromiseInMockedEnvironment'
import {
  createAndImportUsersFromNetwork,
  type DummyUser,
  generateKeysAndHasheForNumber,
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
          createAndImportUsersFromNetwork(twoUser, networkTwo)
        )
      )
    })
  )
})

describe('Common connections', () => {
  it('Fetches common connections for array of friends', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const app = yield* _(NodeTestingApp)

        const me = networkOne[0]
        const userContacts = Array.filter(
          networkOne,
          (u) => u.keys.publicKeyPemBase64 !== me.keys.publicKeyPemBase64
        )

        const connections = yield* _(
          app.fetchCommonConnections(
            {
              body: {
                publicKeys: Array.map(
                  userContacts,
                  (one) => one.keys.publicKeyPemBase64
                ),
              },
            },
            HttpClientRequest.setHeaders(networkOne[0].authHeaders)
          )
        )

        const resultKeys = pipe(
          connections.commonContacts,
          Array.map((c) => c.publicKey),
          Array.sort(Order.string),
          Array.join(', ')
        )
        // Result keys equals to requestzdcgtrfdcdfgtzrcfedxs
        expect(resultKeys).toBe(
          pipe(
            userContacts,
            Array.map((o) => o.keys.publicKeyPemBase64),
            Array.sort(Order.string),
            Array.join(', ')
          )
        )

        // Each friend should have other people as common friends
        for (const {common, publicKey} of connections.commonContacts) {
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
})
